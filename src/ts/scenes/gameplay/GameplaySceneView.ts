import { Assets } from "../../collections/AssetGameplay";
import { PreferredDisplaySizeComponent } from "../../components/transform/PreferredDisplaySizeComponent";
import { DisplayOriginalRatioComponent } from "../../components/transform/DisplayOriginalRatioComponent";
import { BaseView } from "../../modules/core/BaseView";
import { ScreenUtilController } from "../../modules/screenutility/ScreenUtilController";
import { ComponentService } from "../../modules/services/ComponentService";
import { ScaleToDisplaySizeComponent } from "../../components/transform/ScaleToDisplaySizeComponent";
import { ClickableComponent } from "../../components/ClickableComponent";
import shortUUID from "short-uuid";
import { FontAsset } from "../../collections/AssetFont";
import { LAYER_DEPTH } from "../../info/SceneInfo";
import { DisplayOriginPositionComponent } from "../../components/transform/DisplayOriginPositionComponent";

export const enum EventNames {
	onPlaySFX = "onPlaySFX",
	onTapBall = "onTapBall",
	onCreateFinish = "onCreateFinish",
};

const BASE_GRAVITY = 0.006;

const COLLIDE_HISTORY = "COLLIDE_HISTORY";
const BALL_CATEGORY = "BALL_CATEGORY";
const TRAVERSAL_PROP = "TRAVERSAL_PROP";

type BallCollection = {
	[x: string]: Phaser.Physics.Matter.Image;
}

type CollideHistory = {
	[x: string]: boolean;
}

type TraversalData = {
	neighbourIds: string[];
}

export class GameplaySceneView implements BaseView {

	event: Phaser.Events.EventEmitter;
	screenUtility: ScreenUtilController;

	private _components: ComponentService;

	private _screenRatio: DisplayOriginalRatioComponent;
	private _bgPos: DisplayOriginPositionComponent;

	private _ballCollection: BallCollection;

	private _timerText: Phaser.GameObjects.Text;
	private _scoreText: Phaser.GameObjects.Text;
	private _comboText: Phaser.GameObjects.Text;

	constructor (private _scene: Phaser.Scene) {
		this.screenUtility = ScreenUtilController.getInstance();
		this.event = new Phaser.Events.EventEmitter();
		this._components = new ComponentService();
	}

	create (): void {
		// TODO: Here logic
		this._scene.matter.world.setBounds(0, 0, this.screenUtility.width, this.screenUtility.height, 64, true, true, false, true);
		// this._scene.matter.add.mouseSpring({stiffness: 1});

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

		this._bgPos = new DisplayOriginPositionComponent();
		this._bgPos.init(bg);

		this._ballCollection = {};
		this.timeToCreateBall(40);

		this.createLineWall();

		const matterWorld = this._scene.matter.world;

		matterWorld.setGravity(0, 1, BASE_GRAVITY * this._screenRatio.displayToOriginalHeightRatio);

		const timerTextStyle = {
			fontFamily: FontAsset.roboto.key,
			fontStyle: "bold",
			fontSize: `${125 * this._screenRatio.displayToOriginalHeightRatio}px`,
			align: "center",
		} as Phaser.GameObjects.TextStyle;
		this._timerText = this._scene.add.text(this.screenUtility.centerX, this.screenUtility.height * 0.05, "0", timerTextStyle);
		this._timerText.setOrigin(0.5, 0).setDepth(LAYER_DEPTH.UI);

		const scoreTextStyle = {
			fontFamily: FontAsset.roboto.key,
			fontSize: `${81 * this._screenRatio.displayToOriginalHeightRatio}px`,
			align: "center",
		} as Phaser.GameObjects.TextStyle;
		this._scoreText = this._scene.add.text(this.screenUtility.centerX / 2, this._timerText.getBottomCenter().y, "0", scoreTextStyle);
		this._scoreText.setOrigin(0.5, 0).setDepth(LAYER_DEPTH.UI);

		const comboTextStyle = {
			fontFamily: FontAsset.roboto.key,
			fontSize: `${100 * this._screenRatio.displayToOriginalHeightRatio}px`,
			align: "center",
		} as Phaser.GameObjects.TextStyle;
		this._comboText = this._scene.add.text(this.screenUtility.centerX, this._timerText.getBottomCenter().y * 1.15, "+0", comboTextStyle);
		this._comboText.setOrigin(0.5, 0).setDepth(LAYER_DEPTH.UI);

		this._scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this._components.destroy();
		});
		this.event.emit(EventNames.onCreateFinish);
	}

	private registerOnCollide (goA: Phaser.GameObjects.GameObject, goB: Phaser.GameObjects.GameObject, value: boolean): void {
		const hasName = goA?.name && goB?.name;
		if (!hasName) return;

		const currCollideHistoryA: object = goA.getData(COLLIDE_HISTORY);
		const newHistory = {
			...currCollideHistoryA,
			[goB.name]: value,
		};
		goA.setData(COLLIDE_HISTORY, newHistory);
		goA.setData(TRAVERSAL_PROP, {
			neighbourIds: this.getSimilarNeighbourIds(goA),
		});

		const currCollideHistoryB: object = goB.getData(COLLIDE_HISTORY);
		const newHistory2 = {
			...currCollideHistoryB,
			[goA.name]: value,
		};
		goB.setData(COLLIDE_HISTORY, newHistory2);
		goB.setData(TRAVERSAL_PROP, {
			neighbourIds: this.getSimilarNeighbourIds(goB),
		});
	}

	private timeToCreateBall (num: number): void {
		this._scene.time.addEvent({
			repeat: num-1,
			delay: 150,
			callback: () => this.createBall(1),
		});
	}

	private createBall (num: number, isSpecial?: boolean, pos?: Phaser.Types.Math.Vector2Like): void {
		const { centerX, width, height } = this.screenUtility;
		const textureKeys = [Assets.emoji_1.key, Assets.emoji_2.key, Assets.emoji_3.key, Assets.emoji_4.key];

		let density = 0.001;
		for (let i = 0; i < num; i++) {
			const x = centerX + Phaser.Utils.Array.GetRandom([-width/8, width/8, 0]);
			const textureKey = isSpecial ? Assets.ball_bomb_a.key : Phaser.Utils.Array.GetRandom(textureKeys);
			const sprite = this._scene.matter.add.image(0, 0, textureKey).setName(textureKey + "_" + shortUUID.generate());

			if (isSpecial && pos) { // If use bomb, create sensor-based instead!
				sprite.setPosition(pos.x, pos.y);
			}
			else {
				sprite.setPosition(x, -height * 0.15);
			}

			sprite.setData(BALL_CATEGORY, textureKey);

			const scale = isSpecial ? 1.8 : 1.685;
			const spriteScale = new ScaleToDisplaySizeComponent(this._screenRatio.displayToOriginalHeightRatio * scale);
			spriteScale.init(sprite);
			spriteScale.awake();

			sprite.setCircle(sprite.displayHeight / 1.8, {
				restitution: 0.35,
				friction: 0.002,
				density
			});
			density += 0.0001;
			sprite.setAngularVelocity(0.015);

			sprite.setData(COLLIDE_HISTORY, {});
			sprite.setData(TRAVERSAL_PROP, {});

			//#region setOnCollide event
			sprite.setOnCollide((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
				if (sprite.name !== data.bodyA.gameObject?.name) return;
				const go = data.bodyA.gameObject;
				const go2 = data.bodyB.gameObject;
				this.registerOnCollide(go, go2, true);
			});

			sprite.setOnCollideActive((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
				if (sprite.name !== data.bodyA.gameObject?.name) return;
				const go = data.bodyA.gameObject;
				const go2 = data.bodyB.gameObject;
				this.registerOnCollide(go, go2, true);
			});

			sprite.setOnCollideEnd((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
				if (sprite.name !== data.bodyA.gameObject?.name) return;
				const go = data.bodyA.gameObject;
				const go2 = data.bodyB.gameObject;
				this.registerOnCollide(go, go2, false);
			});
			//#endregion

			const clickableComponent = new ClickableComponent(() => {
				// console.log("CLICK:", sprite.name);
				// console.log("ALL BALL!", Object.keys(this._ballCollection).length);
				if (sprite.getData(BALL_CATEGORY) !== Assets.ball_bomb_a.key) {
					this.action(sprite);
				}
				else {
					this.actionBomb(sprite);
				}
			});
			clickableComponent.init(sprite);
			clickableComponent.awake();
			clickableComponent.start();

			this._ballCollection = {
				...this._ballCollection,
				[sprite.name]: sprite
			};
		}
	}

	private getSimilarNeighbourIds (sprite: Phaser.GameObjects.GameObject): string[] {
		const history: CollideHistory = sprite.getData(COLLIDE_HISTORY);
		const sameCategoryIds = Object.keys(history)
			.filter((ballId) =>  this._ballCollection[ballId]?.getData(BALL_CATEGORY) === sprite.getData(BALL_CATEGORY));
		return sameCategoryIds.filter((id) => history[id]);
	}

	private traverse (sprite: Phaser.Physics.Matter.Image, exclude: string[]): string[] {
		const { neighbourIds } = sprite.getData(TRAVERSAL_PROP) as TraversalData;

		if (neighbourIds.length <= 0) {
			return [ sprite.name ];
		}
		else {
			const data = [ sprite.name ];
			for (let index = 0; index < neighbourIds.length; index++) {
				const id = neighbourIds[index];
				const targetSprite = this._ballCollection[id];

				if (exclude.includes(targetSprite.name)) continue;
				exclude.push(id);

				data.push(...this.traverse(targetSprite, exclude));
			}

			return data;
		}
	}

	private action (sprite: Phaser.Physics.Matter.Image): void {
		let bombActive = false;

		const exclude = [sprite.name];
		const selectedIdsToDestroy = this.traverse(sprite, exclude);
		if (selectedIdsToDestroy.length > 2) {

			if (selectedIdsToDestroy.length >= 4) {
				const ballId = selectedIdsToDestroy[0];
				const targetBallPos = {
					x: this._ballCollection[ballId].x,
					y: this._ballCollection[ballId].y,
				};

				this.createBall(1, true, targetBallPos);
				bombActive = true;
			}

			selectedIdsToDestroy.forEach((id) => {
				this._ballCollection[id].destroy();

				Reflect.deleteProperty(this._ballCollection, id);
			});
	
			this.timeToCreateBall(bombActive ? selectedIdsToDestroy.length - 1 : selectedIdsToDestroy.length);
			// console.log("[DEBUG]:", selectedIdsToDestroy, selectedIdsToDestroy.length);

			this.event.emit(EventNames.onTapBall, selectedIdsToDestroy.length);
		}
		else {
			console.log("Cant tap destroy!");
		}
	}

	private actionBomb (sprite: Phaser.Physics.Matter.Image): void {
		const history: CollideHistory = sprite.getData(COLLIDE_HISTORY);
		const touchedBallAreaIds = Object.keys(history).filter((id) => history[id]);
		touchedBallAreaIds.forEach((id) => {
			this._ballCollection[id]?.destroy();

			Reflect.deleteProperty(this._ballCollection, id);
		});

		sprite.destroy();
		Reflect.deleteProperty(this._ballCollection, sprite.name);

		this.timeToCreateBall(touchedBallAreaIds.length + 1);
		this.event.emit(EventNames.onTapBall, touchedBallAreaIds.length + 1);
	}

	private createLineWall (): void {
		const leftWallPos = this._bgPos.getDisplayPositionFromCoordinate(0.25, 0);
		const leftWall = this._scene.matter.add.rectangle(0, 0, (64 * this._screenRatio.displayToOriginalHeightRatio), this.screenUtility.height / 3, { isStatic: true, angle: -15 * (Math.PI/180) });
		this._scene.matter.alignBody(leftWall, leftWallPos.x, leftWallPos.y, Phaser.Display.Align.BOTTOM_RIGHT);

		const rightWallPos = this._bgPos.getDisplayPositionFromCoordinate(0.925, 0);
		const rightWall = this._scene.matter.add.rectangle(0, 0, (64 * this._screenRatio.displayToOriginalHeightRatio), this.screenUtility.height / 3, { isStatic: true, angle: 15 * (Math.PI/180) });
		this._scene.matter.alignBody(rightWall, rightWallPos.x, 0, Phaser.Display.Align.TOP_RIGHT);
	}

	updateScore (value: number): void {
		this._scoreText.setText(value.toString());
	}

	updateTimer (value: number): void {
		this._timerText.setText(value.toString());
	}

	updateCombo (value: number): void {
		this._comboText.setText(`+${value}`);
	}

	updateComponents (dt: number): void {
		this._components.update(dt);
	}

	destroy (): void {
		this._components.destroy();
	}

}