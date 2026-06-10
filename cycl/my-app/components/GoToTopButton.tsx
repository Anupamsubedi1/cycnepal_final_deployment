"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";

export default function GoToTopButton() {
  const pathname = usePathname();
  const [showButton, setShowButton] = useState(false);

  const pathSegments = pathname.split("/").filter(Boolean);
  const isVacancyRoute = pathSegments[1] === "vacancies";

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isVacancyRoute) {
    return null;
  }

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Go to top"
      className="fixed bottom-18 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#029a81] text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#027864] active:scale-95"
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  );
}