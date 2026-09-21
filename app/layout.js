import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import WhatsAppHelpButton from "@/components/WhatsAppHelpButton";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Trip Management - Find Your Seat & Hotel",
  description:
    "Trip Passenger Management System. Find your train seat, family seats, hotel room, and complete trip details using your registered mobile number.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen>
        <div className="print:hidden"><Navbar /></div>
        <main className="flex-1">{children}</main>
        <WhatsAppHelpButton />

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/50 print:hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Trip Management System
            </p>
          </div>
        </footer>
              </SplashScreen>
      </body>
    </html>
  );
}
