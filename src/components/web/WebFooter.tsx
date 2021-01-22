import React, {useState} from "react";
import { Image, TouchableOpacity, TouchableHighlight, View } from "react-native";
import { useHistory, useLocation } from "react-router-dom";

import Constants from "expo-constants";

import { Spacing } from "../../constants/dimension";
import useLinker from "../../hooks/useLinker";
import FlexView from "../FlexView";
import SocialIcons from "../SocialIcons";
import Text from "../Text";
import useColors from "../../hooks/useColors";

const FLAGS = {
    us: require("../../../assets/flags/us.png"),
    cn: require("../../../assets/flags/cn.png"),
    kr: require("../../../assets/flags/kr.png"),
    fr: require("../../../assets/flags/fr.png"),
    es: require("../../../assets/flags/es.png"),
    jp: require("../../../assets/flags/jp.png")
};

const ALCHEMY_URL = "https://dashboard.alchemyapi.io/signup?referral=429fb682-0d85-40ab-ad88-daf847cf7c63";

const WebFooter = ({ simple = false }) => {
    const onPressAlchemy = useLinker(ALCHEMY_URL, "", "_blank");
    const { header, borderDark } = useColors();

    const metaMask = window.ethereum?.isMetaMask || false;

    return (
        <View style={{
            width: "100%",
            padding: Spacing.small,
            alignItems: "center",
            position: "fixed",
            bottom: 0,
            backgroundColor: header
        }}>
            {!simple && (
                <>
                    <SocialIcons />
                    {/* <TouchableHighlight onPress={onPressAlchemy}>
                        <Image
                            source={require("../../../assets/alchemy.png")}
                            style={{ width: 188, height: 40, marginTop: Spacing.tiny }}
                        />
                    </TouchableHighlight> */}
                </>
            )}
            <Text note={true} style={{ marginTop: Spacing.tiny }}>
                Built with ❤️ by KobeSwap (v{Constants.manifest.version})
            </Text>
            {/* <FlexView style={{ marginTop: Spacing.small }}>
                <Flag name={"us"} locale={"en"} />
                <Flag name={"es"} locale={"es"} />
                <Flag name={"fr"} locale={"fr"} />
                <Flag name={"cn"} locale={"zh"} />
                <Flag name={"jp"} locale={"jp"} />
                <Flag name={"kr"} locale={"ko"} />
            </FlexView> */}

            metaMask ? <Cattle/>

        </View>
    );
};

const Flag = ({ name, locale }) => {
    const history = useHistory();
    const location = useLocation();
    const onPress = () => {
        history.push(location.pathname + "?locale=" + locale);
    };
    return (
        <TouchableHighlight onPress={onPress} style={{ marginHorizontal: 4 }}>
            <Image source={FLAGS[name]} style={{ width: 30, height: 20 }} />
        </TouchableHighlight>
    );
};

const Cattle = () => {
    const [isHover, setIsHover] = useState({ uri: require("../../../assets/cattle-1.png") });

    return (
        <div style={{
                position: "absolute",
                top: -256,
                right: -50,
                width: 430,
                height: 300,
            }} onMouseOver={() => {setIsHover({ uri: require("../../../assets/cattle-2.png") })}}
            onMouseOut={() => {setIsHover({ uri: require("../../../assets/cattle-1.png") })}}>
                <Image
                    source={isHover}
                    onError={() => { }}
                    style={{
                        width: 430,
                        height: 300
                    }}
                />
            </div>
    );
}

export default WebFooter;
