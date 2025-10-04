import type { Metadata } from "next";
import { Alfa_Slab_One, Righteous, Bungee, Orbitron } from "next/font/google";
import "./globals.css";

const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  variable: "--font-alfa-slab",
  subsets: ["latin"],
});

const righteous = Righteous({
  weight: "400",
  variable: "--font-righteous",
  subsets: ["latin"],
});

const bungee = Bungee({
  weight: "400",
  variable: "--font-bungee",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circus Dash: Street Rush - The Greatest Show on Earth",
  description: "Experience the thrill of circus performance in this fast-paced platformer. Walk the tightrope, navigate clown alley, and master the juggling tunnel!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${alfaSlabOne.variable} ${righteous.variable} ${bungee.variable} ${orbitron.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
