import React, { useContext } from "react";
import { TextStyle } from "react-native";

import { ethers } from "ethers";
import { IS_DESKTOP } from "../constants/dimension";
import Token from "../types/Token";
import { formatBalance } from "../utils";
import Text from "./Text";

import { GlobalContext } from "../context/GlobalContext";

const TokenAmount = (props: { token: Token; amount?: ethers.BigNumber; disabled?: boolean; style?: TextStyle }) => {
    const { darkMode } = useContext(GlobalContext);

    return (
        <Text caption={IS_DESKTOP} disabled={props.disabled} style={props.style}>
            {formatBalance(props.amount || props.token.balance, props.token.decimals, 8)}
        </Text>
    );
}

export default TokenAmount;
