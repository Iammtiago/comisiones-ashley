import "./globals.css";
export const metadata = {
  title: "Ashley · Óptica Newton",
  description: "Tus ventas y comisiones, en un solo lugar.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comisiones Ashley",
  },
  manifest: "/manifest.webmanifest",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e5f4fc",
};
export default function Layout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
