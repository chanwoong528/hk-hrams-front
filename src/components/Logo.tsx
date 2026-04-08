import { useEffect, useState } from "react";

export default function Logo({
  type = "square",
  width,
  height,
}: {
  type?: "square" | "rectangle";
  width?: number;
  height?: number;
}) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    let isMounted = true;
    const loadLogo = async () => {
      // Dynamically import the image to get its URL
      const mod =
        type === "square"
          ? await import("@/assets/logo-square.png")
          : await import("@/assets/logo-rectangle.png");

      if (isMounted) {
        setSrc(mod.default);
      }
    };

    loadLogo();
    return () => {
      isMounted = false;
    };
  }, [type]);

  if (!src) return null;

  return <img src={src} alt="logo" width={width} height={height} />;
}
