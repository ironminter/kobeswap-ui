import React, { FC, useContext } from "react";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import useColors from "../hooks/useColors";
import useTranslation from "../hooks/useTranslation";
import Text from "./Text";

import { GlobalContext } from "../context/GlobalContext";

export interface AmountMetaProps {
    amount?: string;
    suffix?: string;
    disabled?: boolean;
}

const AmountMeta: FC<AmountMetaProps> = props => {
    const t = useTranslation();
    const { textDark, textLight, placeholder } = useColors();

    const { darkMode } = useContext(GlobalContext);

    return (
        <Text
            style={{
                fontSize: IS_DESKTOP ? 28 : 20,
                marginBottom: Spacing.normal,
                // color: props.disabled ? placeholder : props.amount ? textDark : textLight
                color: darkMode ? "#FFFFFF" : "#333333"
            }}>
            {props.disabled ? t("n/a") : props.amount ? props.amount + " " + (props.suffix || "") : t("fetching")}
        </Text>
    );
};

export default AmountMeta;
