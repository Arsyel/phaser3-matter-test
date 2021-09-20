import shortUUID from "short-uuid";
import { Component } from "../modules/services/ComponentService";

type GameObject = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle

export class ClickTweenScaleComponent implements Component {

	private _gameObject: GameObject;
	private _id: string;
	private _tweenManager: Phaser.Tweens.TweenManager;
	private _tweenEffect: Phaser.Tweens.Tween;
	private _onCompleteTween?: Function;

	constructor (scene: Phaser.Scene, onCompleteTween?: Function) {
		this._tweenManager = scene.tweens;
		this._onCompleteTween = onCompleteTween;
	}

	init (go: GameObject): void {
		this._id = go.name + "_" + shortUUID.generate();
		this._gameObject = go;
	}

	getId (): string {
		return this._id;
	}

	awake (): void {
		const scale = this._gameObject.scale;
		this._tweenEffect = this._tweenManager.create({
			targets: this._gameObject,
			duration: 50,
			props: {
				scale: { getStart: () => scale, getEnd: () => scale * 0.9 },
			},
			yoyo: true,
			onComplete: (this._onCompleteTween) && this._onCompleteTween,
		});
	}

	destroy (): void {
		this._tweenEffect.remove();
	}

	play (force?: boolean): void {
		if (this._tweenEffect.isPlaying() && !force) {
			return;
		}
		this._tweenEffect.play();
	}

}