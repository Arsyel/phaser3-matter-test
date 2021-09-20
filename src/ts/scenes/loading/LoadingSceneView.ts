import { BaseView } from "../../modules/core/BaseView";
import { ScreenUtilController } from "../../modules/screenutility/ScreenUtilController";
import { Assets } from "../../collections/AssetLoading";
import { AnimationHelper } from "../../helper/AnimationHelper";
import { Animations } from "../../collections/AssetAnimation";
import { CustomTypes } from "../../../types/custom";
import { ComponentService } from "../../modules/services/ComponentService";
import { PreferredDisplaySizeComponent } from "../../components/transform/PreferredDisplaySizeComponent";
import { ScaleToDisplaySizeComponent } from "../../components/transform/ScaleToDisplaySizeComponent";
import { DisplayOriginalRatioComponent } from "../../components/transform/DisplayOriginalRatioComponent";
import { DisplayOriginPositionComponent } from "../../components/transform/DisplayOriginPositionComponent";

export class LoadingSceneView implements BaseView {

	private _progressText: Phaser.GameObjects.Text;
	private _bar: Phaser.GameObjects.Sprite;
	private _progressBar: Phaser.GameObjects.Graphics;
	private _components: ComponentService;

	event: Phaser.Events.EventEmitter;
	screenUtility: ScreenUtilController;

	constructor (private _scene: Phaser.Scene) {
		this.event = new Phaser.Events.EventEmitter();
		this.screenUtility = ScreenUtilController.getInstance();
		this._components = new ComponentService();
	}

	create (): void {
		this.createBackground();
		this.createLoadingComponents();
	}

	private createBackground (): void {
		const sprite = this._scene.add.image(this.screenUtility.centerX, this.screenUtility.centerY, Assets.loading_bg.key);
		this._components.addComponent(sprite, new PreferredDisplaySizeComponent("MIN", this.screenUtility.width, this.screenUtility.height));
	}

	private createLoadingComponents (): void {
		const frame = this._scene.add.sprite(this.screenUtility.centerX, this.screenUtility.centerY, Assets.loading_frame.key);
		this._components.addComponent(frame, new ScaleToDisplaySizeComponent(this.screenUtility.screenPercentage));
		this._components.addComponent(frame, new DisplayOriginalRatioComponent());
		this._components.addComponent(frame, new DisplayOriginPositionComponent());

		frame.setOrigin(0.5)
			.setDepth(1)
			.setAlpha(1);

		const frameRatio = this._components.findComponent(frame, DisplayOriginalRatioComponent) as DisplayOriginalRatioComponent;
		const frameCoordinatePosition = this._components.findComponent(frame, DisplayOriginPositionComponent) as DisplayOriginPositionComponent;

		const loadingTextAnim = this._scene.add.sprite(0, 0, Assets.loading_text.key);
		this._components.addComponent(loadingTextAnim, new ScaleToDisplaySizeComponent(frameRatio.displayToOriginalHeightRatio));

		loadingTextAnim.setOrigin(0.5, 1)
			.setPosition(frameCoordinatePosition.getDisplayPositionFromCoordinate(0.5, 0).x, frameCoordinatePosition.getDisplayPositionFromCoordinate(0.5, 0).y);

		AnimationHelper.AddAnimation(this._scene, Animations.loading_text as CustomTypes.Asset.AnimationInfoType);
		loadingTextAnim.play(Animations.loading_text.key);

		const offsetFrameY = 12.25 * frameRatio.displayToOriginalHeightRatio;
		this._bar = this._scene.add.sprite(frame.x, frame.y - offsetFrameY, Assets.loading_bar.key);
		this._components.addComponent(this._bar, new ScaleToDisplaySizeComponent(frameRatio.displayToOriginalWidthRatio));

		this._bar.setOrigin(0.5)
			.setDepth(2)
			.setAlpha(1);

		this._progressText = this._scene.add.text(frame.x, frame.getBottomCenter().y + (16 * frameRatio.displayToOriginalHeightRatio), '0%', { color: '#ffd561', fontStyle: 'bold', align: 'center' });
		this._progressText
			.setOrigin(0.5, 0)
			.setFontSize(48 * frameRatio.displayToOriginalHeightRatio);

		this._progressBar = this._scene.add.graphics().setVisible(false);
	}

	updateLoading (value: number): void {
		const mask = this._progressBar.createGeometryMask();
		this._bar.setMask(mask);

		const percent = Math.round(value * 100).toString() + " %";
		this._progressText.setText(percent);

		this._progressBar.clear();
		this._progressBar.fillStyle(0xffffff, 1);

		const height = this._bar.displayHeight;
		const width = this._bar.displayWidth;
		this._progressBar.fillRect(
			this._bar.getTopLeft().x,
			this._bar.getTopLeft().y,
			value * width,
			height
		);
	}

	destroy (): void {
		this._components.destroy();
	}

}