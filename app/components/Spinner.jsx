export function Spinner() {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<div className="fixed top-[45vh]">
				<div className="relative">
					{/* Spinner */}
					<div className="animate-spin rounded-full h-40 w-40 border-t-4 border-[#5B49EF]"></div>

					{/* Spinning Image */}
					<img
						src="/assets/svgs/blue_love2.svg"
						alt="spinner-icon"
						className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px]"
					/>
				</div>
			</div>
		</div>
	);
}
