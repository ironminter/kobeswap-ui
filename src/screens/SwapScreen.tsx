import React, { useCallback, useContext, useState } from "react";
import { Platform, View } from "react-native";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import AmountMeta from "../components/AmountMeta";
import ApproveButton from "../components/ApproveButton";
import BackgroundImage from "../components/BackgroundImage";
import Border from "../components/Border";
import Button from "../components/Button";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import ExperimentalNotice from "../components/ExperimentalNotice";
import FetchingButton from "../components/FetchingButton";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import InsufficientBalanceButton from "../components/InsufficientBalanceButton";
import Meta from "../components/Meta";
import Notice from "../components/Notice";
import Select, { Option } from "../components/Select";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenSelect from "../components/TokenSelect";
import UnsupportedButton from "../components/UnsupportedButton";
import WebFooter from "../components/web/WebFooter";
import { SwapSubMenu } from "../components/web/WebSubMenu";
import { ROUTER, SETTLEMENT } from "../constants/contracts";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import useColors from "../hooks/useColors";
import useDelayedEffect from "../hooks/useDelayedEffect";
import useLinker from "../hooks/useLinker";
import useSwapState, { OrderType, SwapState } from "../hooks/useSwapState";
import useTranslation from "../hooks/useTranslation";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { formatBalance, isEmptyValue, isETH, isETHWETHPair, isWETH, parseBalance } from "../utils";
import Screen from "./Screen";

import { GlobalContext } from "../context/GlobalContext";

const SwapScreen = () => {
    const t = useTranslation();
    const { darkMode } = useContext(GlobalContext);
    return (
        <Screen>
            <Container>
                {/* <BackgroundImage /> */}
                <Content>
                    <Title text={t("new-order")} style={{
                        color: darkMode ? "#FFFFFF" : "#333333"
                    }} />
                    <Text light={true} style={{
                        color: darkMode ? "#4B607E" : "#333333"
                    }}>{t("new-order-desc")}</Text>
                    <Swap />
                </Content>
                {/* {Platform.OS === "web" && <WebFooter />} */}

                <View style={{ height: 200, padding: 20 }}>
                </View>
            </Container>
            <SwapSubMenu />
        </Screen>
    );
};

const Swap = () => {
    const state = useSwapState();
    return (
        <View style={{ marginTop: Spacing.large }}>
            <OrderTypeSelect state={state} />
            <Border />
            <FromTokenSelect state={state} />
            <Border />
            <ToTokenSelect state={state} />
            <Border />
            <AmountInput state={state} />
            {state.orderType === "limit" && (
                <View style={{ marginTop: Spacing.small }}>
                    <AmountNotice state={state} />
                    <Border />
                    <PriceInput state={state} />
                </View>
            )}
            {!state.loading && !state.trade && <NoPairNotice state={state} />}
            <TradeInfo state={state} />
        </View>
    );
};

const OrderTypeSelect = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    const options: Option[] = [
        { key: "market", title: t("market-order"), description: t("market-order-desc") },
        { key: "limit", title: t("limit-order"), description: t("limit-order-desc") }
    ];
    return (
        <View>
            <Select
                title={t("order-type")}
                options={options}
                option={options.find(option => option.key === state.orderType)}
                setOption={option => state.setOrderType(option?.key as OrderType | undefined)}
            />
            {state.orderType === "limit" && (
                <ExperimentalNotice
                    contractURL={
                        "https://github.com/sushiswap/sushiswap-settlement/blob/master/contracts/Settlement.sol"
                    }
                />
            )}
        </View>
    );
};

const FromTokenSelect = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    const { tokens, customTokens } = useContext(EthersContext);
    if (!state.orderType) {
        return <Heading text={t("token-to-sell")} disabled={true} />;
    }
    const ETH = tokens ? tokens.find(token => isETH(token)) : null;
    return (
        <View>
            <TokenSelect
                title={t("token-to-sell")}
                symbol={state.fromSymbol}
                onChangeSymbol={state.setFromSymbol}
                hidden={token =>
                    (!customTokens.find(tk => tk.address === token.address) && token.balance.isZero()) ||
                    (state.orderType === "limit" && isETH(token))
                }
            />
            {state.orderType === "limit" && !state.fromSymbol && ETH && !ETH.balance.isZero() && (
                <LimitOrderUnsupportedNotice />
            )}
        </View>
    );
};

const ToTokenSelect = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    if (!state.orderType || !state.fromSymbol) {
        return <Heading text={t("token-to-buy")} disabled={true} />;
    }
    const limit = state.orderType === "limit";
    const onChangeSymbol = (symbol: string) => {
        state.setToSymbol(limit && symbol === "ETH" ? "WETH" : symbol);
    };
    return (
        <View>
            <TokenSelect
                title={t("token-to-buy")}
                symbol={state.toSymbol}
                onChangeSymbol={onChangeSymbol}
                hidden={token => token.symbol === state.fromSymbol || (limit && isETH(token))}
            />
            {state.orderType === "limit" && !state.toSymbol && <LimitOrderUnsupportedNotice />}
        </View>
    );
};

const AmountInput = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={t("amount")} disabled={true} />;
    }
    return (
        <View>
            <Heading text={state.fromSymbol + " " + t("amount")} />
            <TokenInput
                token={state.fromToken}
                amount={state.fromAmount}
                onAmountChanged={state.setFromAmount}
                autoFocus={IS_DESKTOP}
            />
        </View>
    );
};

const AmountNotice = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    if (
        state.priceInETH === undefined ||
        isEmptyValue(state.fromAmount) ||
        !state.fromToken ||
        (state.priceInETH && parseBalance(state.fromAmount, state.fromToken.decimals).lte(state.priceInETH.mul(10)))
    ) {
        return <View />;
    }
    return (
        <View>
            <Notice
                text={
                    state.priceInETH === null
                        ? t("token-not-supported-in-beta")
                        : t("maximum-allowed-amount-in-beta", {
                            amount: formatBalance(state.priceInETH.mul(10), state.fromToken!.decimals),
                            symbol: state.fromSymbol
                        })
                }
                color={"red"}
            />
        </View>
    );
};

const PriceInput = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    if (!state.fromSymbol || !state.toSymbol) {
        return <Heading text={t("minimum-price")} disabled={true} />;
    }
    const marketPrice =
        state.toToken && state.trade
            ? parseBalance(state.trade.executionPrice.invert().toFixed(state.toToken.decimals), state.toToken.decimals)
            : ethers.constants.Zero;
    return (
        <TokenInput
            title={t("minimum-price") + " (" + state.fromSymbol + "/" + state.toSymbol + ")"}
            token={
                {
                    ...state.toToken,
                    balance: marketPrice
                } as Token
            }
            amount={state.limitOrderPrice}
            onAmountChanged={state.setLimitOrderPrice}
            maxButtonText={t("-market-")}
        />
    );
};

const LimitOrderUnsupportedNotice = () => {
    const { placeholder } = useColors();
    const t = useTranslation();
    return (
        <Notice
            text={t("eth-not-supported-for-limit-orders")}
            color={placeholder}
            clear={true}
            style={{ marginVertical: Spacing.small, marginHorizontal: Spacing.tiny }}
        />
    );
};

const NoPairNotice = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    return (
        <Notice
            text={t("pair-not-created", { fromSymbol: state.fromSymbol, toSymbol: state.toSymbol })}
            color={"red"}
            style={{ marginTop: Spacing.normal }}
        />
    );
};

const TradeInfo = ({ state }: { state: SwapState }) => {
    if (isETHWETHPair(state.fromToken, state.toToken)) {
        return <WrapInfo state={state} />;
    }
    const disabled =
        state.fromSymbol === "" ||
        state.toSymbol === "" ||
        isEmptyValue(state.fromAmount) ||
        (state.orderType === "limit" && isETH(state.fromToken)) ||
        (!state.loading && !state.trade);
    return (
        <InfoBox>
            {state.orderType === "limit" ? (
                <LimitOrderInfo state={state} />
            ) : (
                    <SwapInfo state={state} disabled={disabled} />
                )}
        </InfoBox>
    );
};

const WrapInfo = ({ state }: { state: SwapState }) => {
    const disabled = isEmptyValue(state.fromAmount);
    return (
        <InfoBox>
            <Text style={{ fontSize: 28, marginBottom: Spacing.normal }} disabled={disabled}>
                {disabled ? "N/A" : state.fromAmount + " " + state.toSymbol}
            </Text>
            <SwapControls state={state} />
        </InfoBox>
    );
};

const SwapInfo = ({ state, disabled }: { state: SwapState; disabled: boolean }) => {
    const t = useTranslation();
    const amount = state.trade?.outputAmount?.toFixed();
    const price = state.trade?.executionPrice?.toFixed();
    const impact = state.trade?.priceImpact?.toFixed(2);
    return (
        <View>
            <AmountMeta amount={amount} suffix={state.toSymbol} disabled={disabled} />
            <Meta
                label={t("price")}
                text={price}
                suffix={state.toSymbol + "  = 1 " + state.fromSymbol}
                disabled={disabled}
            />
            <Meta label={t("price-impact")} text={impact} suffix={"%"} disabled={disabled} />
            <Meta label={t("fee-amount")} text={state.swapFee} suffix={state.fromSymbol} disabled={disabled} />
            <SwapControls state={state} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const SwapControls = ({ state }: { state: SwapState }) => {
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    const approveRequired = !isETH(state.fromToken) && !state.fromTokenAllowed;
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.fromToken ||
                !state.toToken ||
                isEmptyValue(state.fromAmount) ||
                (!state.loading && !state.trade) ? (
                    <SwapButton state={state} onError={setError} disabled={true} />
                ) : parseBalance(state.fromAmount, state.fromToken.decimals).gt(state.fromToken.balance) ? (
                    <InsufficientBalanceButton symbol={state.fromSymbol} />
                ) : isWETH(state.fromToken) && isETH(state.toToken) ? (
                    <UnwrapButton state={state} onError={setError} />
                ) : isETH(state.fromToken) && isWETH(state.toToken) ? (
                    <WrapButton state={state} onError={setError} />
                ) : state.unsupported ? (
                    <UnsupportedButton state={state} />
                ) : state.loading || !state.trade ? (
                    <FetchingButton />
                ) : (
                                        <>
                                            <ApproveButton
                                                token={state.fromToken}
                                                spender={ROUTER}
                                                onSuccess={() => state.setFromTokenAllowed(true)}
                                                onError={setError}
                                                hidden={!approveRequired}
                                            />
                                            <SwapButton state={state} onError={setError} disabled={approveRequired} />
                                        </>
                                    )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const SwapButton = ({ state, onError, disabled }: { state: SwapState; onError: (e) => void; disabled: boolean }) => {
    const t = useTranslation();
    const onPress = useCallback(() => {
        onError({});
        state.onSwap().catch(onError);
    }, [state.onSwap, onError]);
    return (
        <Button
            title={t("swap-", {
                symbol: state.fromSymbol && state.toSymbol ? " " + state.fromSymbol + "-" + state.toSymbol : ""
            })}
            disabled={disabled}
            loading={state.swapping}
            onPress={onPress}
        />
    );
};

const WrapButton = ({ state, onError }: { state: SwapState; onError: (e) => void }) => {
    const t = useTranslation();
    const onPress = useCallback(async () => {
        onError({});
        state.onWrap().catch(onError);
    }, []);
    return <Button title={t("wrap")} loading={state.wrapping} onPress={onPress} />;
};

const UnwrapButton = ({ state, onError }: { state: SwapState; onError: (e) => void }) => {
    const t = useTranslation();
    const onPress = useCallback(async () => {
        onError({});
        state.onUnwrap().catch(onError);
    }, []);
    return <Button title={t("unwrap")} loading={state.unwrapping} onPress={onPress} />;
};

const LimitOrderInfo = ({ state }: { state: SwapState }) => {
    const t = useTranslation();
    const d = !state.trade?.executionPrice;
    return (
        <View>
            <Text
                disabled={isEmptyValue(state.limitOrderReturn)}
                style={{ fontSize: 28, marginBottom: Spacing.normal }}>
                {isEmptyValue(state.limitOrderReturn) ? "N/A" : state.limitOrderReturn + " " + state.toSymbol}
            </Text>
            <Meta
                label={t("market-price")}
                text={state.trade?.executionPrice?.invert().toFixed(8) || undefined}
                suffix={state.fromSymbol + " / " + state.toSymbol}
                disabled={d}
            />
            <Meta label={t("relayer-fee-amount")} text={state.limitOrderFee} suffix={state.fromSymbol} disabled={d} />
            <Meta label={t("swap-fee-amount")} text={state.limitOrderSwapFee} suffix={state.fromSymbol} disabled={d} />
            <Meta label={t("expiration")} text={t("24-hours-from-now")} disabled={d} />
            <LimitOrderControls state={state} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const LimitOrderControls = ({ state }: { state: SwapState }) => {
    const { getTokenAllowance } = useContext(EthersContext);
    const [error, setError] = useState<MetamaskError>({});
    const [allowed, setAllowed] = useState<boolean>();
    useAsyncEffect(() => setError({}), [state.fromSymbol, state.toSymbol, state.fromAmount]);
    useDelayedEffect(
        async () => {
            if (state.fromToken && !isEmptyValue(state.fromAmount)) {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const allowance = await getTokenAllowance(state.fromToken.address, SETTLEMENT);
                setAllowed(ethers.BigNumber.from(allowance).gte(fromAmount));
            }
        },
        500,
        [state.fromToken, state.fromAmount]
    );
    const disabled =
        state.orderType === "market" ||
        state.toSymbol === "" ||
        !state.fromToken ||
        !state.toToken ||
        isEmptyValue(state.fromAmount) ||
        !state.priceInETH ||
        parseBalance(state.fromAmount, state.fromToken!.decimals).gt(state.priceInETH.mul(10)) ||
        !state.trade ||
        isEmptyValue(state.limitOrderPrice);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {disabled ? (
                <PlaceOrderButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.fromAmount, state.fromToken!.decimals).gt(state.fromToken!.balance) ? (
                <InsufficientBalanceButton symbol={state.fromSymbol} />
            ) : !Fraction.parse(state.limitOrderPrice).gt(
                Fraction.parse(state.trade!.executionPrice.invert().toFixed(state.toToken!.decimals))
            ) ? (
                            <PriceTooLowButton />
                        ) : state.unsupported ? (
                            <UnsupportedButton state={state} />
                        ) : state.loading || !state.trade ? (
                            <FetchingButton />
                        ) : (
                                    <>
                                        <ApproveButton
                                            token={state.fromToken!}
                                            spender={SETTLEMENT}
                                            onSuccess={() => setAllowed(true)}
                                            onError={setError}
                                            hidden={allowed}
                                        />
                                        <PlaceOrderButton state={state} onError={setError} disabled={!allowed} />
                                    </>
                                )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const PriceTooLowButton = () => {
    const t = useTranslation();
    return <Button title={t("set-price-greater-than-market")} disabled={true} />;
};

const PlaceOrderButton = ({
    state,
    onError,
    disabled
}: {
    state: SwapState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const t = useTranslation();
    const goToLimitOrders = useLinker("/swap/my-orders", "LimitOrders");
    const onPress = useCallback(async () => {
        onError({});
        try {
            await state.onCreateOrder();
            goToLimitOrders();
        } catch (e) {
            onError(e);
        }
    }, [state.onCreateOrder, goToLimitOrders, onError]);
    return (
        <Button title={t("place-limit-order")} disabled={disabled} loading={state.creatingOrder} onPress={onPress} />
    );
};

export default SwapScreen;
