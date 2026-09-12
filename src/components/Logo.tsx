import Link from "next/link";

type LogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

export default function Logo({
  href = "/",
  size = "md",
}: LogoProps) {
  const sizes = {
    sm: {
      icon: "h-8 w-8",
      title: "text-lg",
    },
    md: {
      icon: "h-10 w-10",
      title: "text-2xl",
    },
    lg: {
      icon: "h-12 w-12",
      title: "text-3xl",
    },
  };

  const current = sizes[size];

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3"
      aria-label="LegendProfit"
    >
      <span
        className={`${current.icon} relative flex shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[70%] w-[70%]"
          aria-hidden="true"
        >
          <path
            d="M10 34L19 25L25 30L38 14"
            stroke="black"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M29 14H38V23"
            stroke="black"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle
            cx="10"
            cy="34"
            r="3"
            fill="black"
          />

          <circle
            cx="19"
            cy="25"
            r="3"
            fill="black"
          />

          <circle
            cx="25"
            cy="30"
            r="3"
            fill="black"
          />
        </svg>
      </span>

      <span
        className={`${current.title} font-black tracking-tight text-white`}
      >
        Legend<span className="text-emerald-400">Profit</span>
      </span>
    </Link>
  );
}