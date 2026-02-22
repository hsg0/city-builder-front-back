import React from "react";
import { View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import image from "../../assets/images/City-Builder-assets/image.png"; 
// If your file is different, change the path.

export default function Overlay() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image source={image} style={{ width: 140, height: 140 }} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}