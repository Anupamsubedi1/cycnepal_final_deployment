import Image from "next/image";

export default function LoadingScreen() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#edf3f6] px-6">
			<div className="flex flex-col items-center justify-center gap-4 text-center">
				<div className="relative h-28 w-28 sm:h-36 sm:w-36">
					<Image
						src="/images/cyc-logo-introduction.png"
						alt="CYC logo"
						fill
						priority
						sizes="(max-width: 640px) 112px, 144px"
						className="object-contain"
					/>
				</div>
				<p className="text-center text-xl font-semibold text-slate-800 sm:text-2xl">The CYC Nepal Laghubitta Bittiya Sanstha Ltd.</p>
			</div>
		</div>
	);
}
