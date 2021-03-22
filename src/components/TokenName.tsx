import React, {useContext} from "react";

import { IS_DESKTOP, Spacing } from "../constants/dimension";
import Token from "../types/Token";
import Text from "./Text";

import { GlobalContext } from "../context/GlobalContext";

const TokenName = (props: { token: Token; disabled?: boolean }) => {
    const { darkMode } = useContext(GlobalContext);

    return (
        <Text
            caption={true}
            numberOfLines={1}
            ellipsizeMode={"tail"}
            style={{ 
                marginLeft: Spacing.small, 
                width: 180,
                color: darkMode ? "#FFFFFF" : "#333333"
            }}
            disabled={props.disabled}>
            {IS_DESKTOP ? props.token.name : props.token.symbol}
        </Text>
    );
}

export default TokenName;
