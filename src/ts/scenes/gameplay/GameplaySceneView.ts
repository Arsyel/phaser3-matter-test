import { Assets } from "../../collections/AssetGameplay";
import { PreferredDisplaySizeComponent } from "../../components/transform/PreferredDisplaySizeComponent";
import { DisplayOriginalRatioComponent } from "../../components/transform/DisplayOriginalRatioComponent";
import { BaseView } from "../../modules/core/BaseView";
import { ScreenUtilController } from "../../modules/screenutility/ScreenUtilController";
import { ComponentService } from "../../modules/services/ComponentService";
import { ScaleToDisplaySizeComponent } from "../../components/transform/ScaleToDisplaySizeComponent";
import { ClickableComponent } from "../../components/ClickableComponent";
import shortUUID from "short-uuid";

export const enum EventNames {
	onPlaySFX = "onPlaySFX",
	onClickRestart = "onClickRestart",
	onCreateFinish = "onCreateFinish",
};

const BASE_GRAVITY = 0.001;

export class GameplaySceneView implements BaseView {

	event: Phaser.Events.EventEmitter;
	screenUtility: ScreenUtilController;

	private _restartKey: Phaser.Input.Keyboard.Key;
	private _components: ComponentService;

	private _screenRatio: DisplayOriginalRatioComponent;

	constructor (private _scene: Phaser.Scene) {
		this.screenUtility = ScreenUtilController.getInstance();
		this.event = new Phaser.Events.EventEmitter();
		this._components = new ComponentService();
	}

	get restartKey (): Phaser.Input.Keyboard.Key {
		return this._restartKey;
	}

	create (): void {
		this._restartKey = this._scene.input.keyboard.addKey('R');

		// TODO: Here logic
		this._scene.matter.world.setBounds();

		const shapeConfig: any = {
			shape : Reflect.get(this._scene.cache.json.get(Assets.json_holder.key), "holder")
		};
		const bg = this._scene.matter.add.sprite(0, 0, Assets.holder.key, "", shapeConfig);

		const prefBGDisplay = new PreferredDisplaySizeComponent("MAX", this.screenUtility.width, this.screenUtility.height);
		prefBGDisplay.init(bg);
		prefBGDisplay.awake();

		this._scene.matter.alignBody(bg, this.screenUtility.centerX, this.screenUtility.height, Phaser.Display.Align.BOTTOM_CENTER);

		this._screenRatio = new DisplayOriginalRatioComponent();
		this._screenRatio.init(bg);

		this._scene.time.addEvent({
			repeat: 7,
			delay: 700,
			callback: () => this.createBall(5),
		});

		const matterWorld = this._scene.matter.world;

		matterWorld.setGravity(0, 1, BASE_GRAVITY * this._screenRatio.displayToOriginalHeightRatio);

		this._scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this._components.destroy();
		});
		this.event.emit(EventNames.onCreateFinish);
	}

	createBall (num: number): void {
		const { centerX, height } = this.screenUtility;
		const textureKeys = [Assets.emoji_1.key, Assets.emoji_2.key, Assets.emoji_3.key, Assets.emoji_4.key];

		const COLLIDE_HISTORY = "COLLIDE_HISTORY";

		for (let i = 0; i < num; i++) {
			const x = centerX + Phaser.Math.RND.integerInRange(-5, 5);
			const y = (height * 0.15) + Phaser.Math.RND.integerInRange(-10, 10);
			const textureKey = Phaser.Utils.Array.GetRandom(textureKeys);
			const sprite = this._scene.matter.add.image(x, y, textureKey).setName(textureKey + "_" + shortUUID.generate());

			const spriteScale = new ScaleToDisplaySizeComponent(this._screenRatio.displayToOriginalHeightRatio * 1.65);
			spriteScale.init(sprite);
			spriteScale.awake();

			sprite.setCircle(sprite.displayHeight / 2.1, { restitution: 1, friction: 0.8, density: 0.5, circleRadius: sprite.displayHeight / 1.35 });

			if (Math.random() > 0.35) {
				sprite.setVelocityY(Phaser.Utils.Array.GetRandom([5, 10, 15, 20]));
			};

			sprite.setData(COLLIDE_HISTORY, {});

			// sprite.setOnCollide((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
			// 	if (sprite.name !== data.bodyA.gameObject?.name) return;
			// 	// console.log(">> " + data.bodyA.gameObject.name, "collided with", data.bodyB.gameObject.name);

			// 	const go = data.bodyA.gameObject;
			// 	const currCollideHistory: object = go.getData(COLLIDE_HISTORY);
			// 	go.setData(COLLIDE_HISTORY, {
			// 		...currCollideHistory,
			// 		[data.bodyB.gameObject.name]: true,
			// 	});

			// 	const go2 = data.bodyB.gameObject;
			// 	const currCollideHistory2: object = go2.getData(COLLIDE_HISTORY);
			// 	go2.setData(COLLIDE_HISTORY, {
			// 		...currCollideHistory2,
			// 		[data.bodyA.gameObject.name]: true,
			// 	});
			// });

			sprite.setOnCollideActive((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
				if (sprite.name !== data.bodyA.gameObject?.name) return;

				const go = data.bodyA.gameObject;
				const currCollideHistory: object = go.getData(COLLIDE_HISTORY);
				go.setData(COLLIDE_HISTORY, {
					...currCollideHistory,
					[data.bodyB.gameObject.name]: true,
				});

				const go2 = data.bodyB.gameObject;
				const currCollideHistory2: object = go2.getData(COLLIDE_HISTORY);
				go2.setData(COLLIDE_HISTORY, {
					...currCollideHistory2,
					[sprite.name]: true,
				});
			});

			sprite.setOnCollideEnd((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
				if (sprite.name !== data.bodyA.gameObject?.name) return;

				const go = data.bodyA.gameObject;
				const currCollideHistory: object = go.getData(COLLIDE_HISTORY);
				go.setData(COLLIDE_HISTORY, {
					...currCollideHistory,
					[data.bodyB.gameObject.name]: false,
				});

				const go2 = data.bodyB.gameObject;
				const currCollideHistory2: object = go2.getData(COLLIDE_HISTORY);
				go2.setData(COLLIDE_HISTORY, {
					...currCollideHistory2,
					[sprite.name]: false,
				});
			});

			const clickableComponent = new ClickableComponent(() => {
				console.log("Click::", sprite.name);
				const collideHistory = sprite.getData(COLLIDE_HISTORY);
				console.log(Object.values(collideHistory).reduce((acc: number, curr) => curr ? (acc + 1) : acc, 0));
			});
			clickableComponent.init(sprite);
			clickableComponent.awake();
			clickableComponent.start();
		}
	}

	updateComponents (dt: number): void {
		this._components.update(dt);
	}

	destroy (): void {
		this._components.destroy();
	}

}