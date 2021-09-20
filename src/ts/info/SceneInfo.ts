import { BootSceneController } from "../scenes/boot/BootSceneController";
import { LoadingSceneController } from "../scenes/loading/LoadingSceneController";
import { GameplaySceneController } from "../scenes/gameplay/GameplaySceneController";

export const SceneInfo = {
	BOOT: {
		key: "BootScene",
		scene: BootSceneController
	},
	LOADING: {
		key: "LoadingScene",
		scene: LoadingSceneController
	},
	GAMEPLAY: {
		key: "GameplayScene",
		scene: GameplaySceneController
	},
};

export function SceneList(): Function[]
{ return Object.values(SceneInfo).map((info) => info.scene); }