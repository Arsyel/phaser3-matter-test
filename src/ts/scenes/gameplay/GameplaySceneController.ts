import { AudioController } from "../../modules/audio/AudioController";
import { EventNames, GameplaySceneView } from "./GameplaySceneView";
import { SceneInfo } from "../../info/SceneInfo";
import { GameController } from "./game/GameController";
import { CustomTypes } from "../../../types/custom";

type OnCreateFinish = CustomTypes.General.FunctionWithParams;
type OnPlaySFX = (sfxKey: string) => void;
type OnTapBall = (total: number) => void;

export class GameplaySceneController extends Phaser.Scene {

	view: GameplaySceneView;
	audioController: AudioController;
	gameController: GameController;

	constructor () {
		super({key: SceneInfo.GAMEPLAY.key});
	}

	init (): void {
		this.view = new GameplaySceneView(this);
		this.audioController = AudioController.getInstance();
		this.gameController = new GameController();

		this.gameController.onInitialization((time) => {
			this.view.updateTimer(time);
		});

		this.gameController.onComboActive((combo) => {
			console.log("Combo: +", combo);
			this.view.updateCombo(combo);
		});

		this.gameController.onComboDeactive(() => {
			// NOTE: Only for debug, the actual is its disappear alone, nothing to do with this event!
			this.view.updateCombo(0);
		});

		this.gameController.onTimerUpdate((time) => {
			this.view.updateTimer(time);
		});

		this.gameController.onTimeout(() => {
			console.log("Times out!");
			this.gameController.setGameOverState();
			this.input.enabled = false;

			this.scene.pause();
		});

		this.onPlaySFX((sfxKey) => this.audioController.playSFX(sfxKey));
		this.onTapBall((total) => {
			this.gameController.addScore(total);
			this.gameController.addCombo();
			this.view.updateScore(this.gameController.score);
		});

		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.view.destroy();
		});

		this.onCreateFinish((uiView) => {
			this.gameController.init(1);
		});
	}

	create (): void {
		this.view.create();
	}

	update (time: number, dt: number): void {
		this.view.updateComponents(dt);
		this.gameController.update(time, dt);
	}

	onPlaySFX (event: OnPlaySFX): void {
		this.view.event.on(EventNames.onPlaySFX, event);
	}

	onTapBall (event: OnTapBall): void {
		this.view.event.on(EventNames.onTapBall, event);
	}

	onCreateFinish (event: OnCreateFinish): void {
		this.view.event.once(EventNames.onCreateFinish, event);
	}

}