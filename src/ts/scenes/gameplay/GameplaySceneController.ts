import { AudioController } from "../../modules/audio/AudioController";
import { EventNames, GameplaySceneView } from "./GameplaySceneView";
import { SceneInfo } from "../../info/SceneInfo";

type OnCreateFinish = (...args: unknown[]) => void;
type OnPlaySFX = (sfxKey: string) => void;

export class GameplaySceneController extends Phaser.Scene {

	view: GameplaySceneView;
	audioController: AudioController;

	constructor () {
		super({key: SceneInfo.GAMEPLAY.key});
	}

	init (): void {
		this.view = new GameplaySceneView(this);
		this.audioController = AudioController.getInstance();

		this.onPlaySFX((sfxKey) => this.audioController.playSFX(sfxKey));
		this.onClickRestart(() => {
			this.scene.start(SceneInfo.GAMEPLAY.key);
			console.log("Call restart!");
		});

		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.view.destroy();
		});
		this.onCreateFinish((uiView) => {});
	}

	create (): void {
		this.view.create();
	}

	update (time: number, dt: number): void {
		if (Phaser.Input.Keyboard.JustUp(this.view.restartKey)) {
			this.view.event.emit(EventNames.onClickRestart);
		}
		this.view.updateComponents(dt);
	}

	onPlaySFX (event: OnPlaySFX): void {
		this.view.event.on(EventNames.onPlaySFX, event);
	}

	onClickRestart (event: Function): void {
		this.view.event.on(EventNames.onClickRestart, event);
	}

	onCreateFinish (event: OnCreateFinish): void {
		this.view.event.once(EventNames.onCreateFinish, event);
	}

}