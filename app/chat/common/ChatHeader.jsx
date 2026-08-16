import { useRouter } from "next/navigation";
import ChatStatus from "./ChatStatus";

const ChatHeader = ({ name, status, avatar, showBackButton = true }) => {
	const router = useRouter();

	return (
		<div className="w-full h-10 flex my-4">
			{showBackButton && (
				<button className="p-2.5 mr-4" onClick={() => router.back()}>
					<img
						loading="lazy"
						src={avatar}
						alt=""
						className="object-contain self-stretch my-auto w-5 aspect-square"
					/>
				</button>
			)}
			<div className="flex flex-grow flex-row">
				<div className="flex flex-col flex-grow px-3">
					<h1 className="text-base">{name}</h1>
					<ChatStatus status={status} />
				</div>
			</div>
		</div>
	);
};

export default ChatHeader;
