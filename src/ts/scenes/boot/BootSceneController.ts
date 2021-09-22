import { ScreenUtilController } from "../../modules/screenutility/ScreenUtilController";
import { LoaderHelper } from "../../helper/LoaderHelper";
import { AudioController } from "../../modules/audio/AudioController";
import { SceneInfo } from "../../info/SceneInfo";
import { FontList } from "../../collections/AssetFont";

export class BootSceneController extends Phaser.Scene {

	private _restartKey: Phaser.Input.Keyboard.Key;

	constructor () {
		super({key: SceneInfo.BOOT.key});
	}

	init (): void {}

	create (): void {
		Promise.all([
			ScreenUtilController.getInstance().init(this),
			AudioController.getInstance().init(this),
			LoaderHelper.LoadFonts(FontList()),
		]).then(() => {
			this.scene.launch(SceneInfo.LOADING.key);
		}).catch((error) => Error("Bootscene::\n" + error));

		this._restartKey = this.input.keyboard.addKey('R');
	}

	update (time: number, dt: number): void {
		if (Phaser.Input.Keyboard.JustUp(this._restartKey)) {
			const { scene: gameplayScene } = this.scene.get(SceneInfo.GAMEPLAY.key);
			if (gameplayScene.isActive()) {
				gameplayScene.start();
			}
		}
	}

}