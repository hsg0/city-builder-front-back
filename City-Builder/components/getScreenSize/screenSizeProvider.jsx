// /components/getScreenSize/screenSizeProvider.jsx
import { useEffect } from "react";
import { Dimensions, PixelRatio } from "react-native";
import { useDispatch } from "react-redux";
import { setScreenSize } from "../../reduxToolKit/reduxState/globalState/screenSlice";

export default function ScreenSizeProvider({ children }) {
  const dispatch = useDispatch();

  const updateScreenSizeInRedux = () => {
    const windowDimensions = Dimensions.get("window");

    const screenWidth = windowDimensions.width;
    const screenHeight = windowDimensions.height;

    const pixelScale = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    dispatch(
      setScreenSize({
        width: screenWidth,
        height: screenHeight,
        scale: pixelScale,
        fontScale: fontScale,
      })
    );
  };

  useEffect(() => {
    updateScreenSizeInRedux();

    const dimensionsSubscription = Dimensions.addEventListener("change", () => {
      updateScreenSizeInRedux();
    });

    return () => {
      dimensionsSubscription?.remove?.();
    };
  }, []);

  return children ?? null;
}