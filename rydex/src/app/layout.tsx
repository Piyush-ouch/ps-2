import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/initUser";
import Provider from "@/Provider";
import { ThemeProvider } from "@/context/ThemeContext";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RYDEX - Smart Vehicle Booking Platform",
  description: "RYDEX ek modern multi-vendor vehicle booking platform hai jahan users aasaani se cars, bikes aur commercial vehicles book kar sakte hain. Secure login, verified owners aur transparent pricing ke saath RYDEX mobility ko simple aur reliable banata hai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider>
          <Provider>
            <StoreProvider>
              <InitUser />
              {children}
            </StoreProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
