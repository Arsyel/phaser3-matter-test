import shortUUID from "short-uuid";
import { Component } from "../modules/services/ComponentService";

type OnClickHandler = (pointer: Phaser.Input.Pointer) => void

export class ClickableComponent implements Component {

	private _gameObject: Phaser.GameObjects.GameObject;
	private _id: string;
	private _handleClick: OnClickHandler;

	constructor (onClickHandler: OnClickHandler) {
		this._handleClick = onClickHandler;
	}

	init (go: Phaser.GameObjects.GameObject): void {
		this._id = go.name + "_" + shortUUID.generate();
		this._gameObject = go;
	}

	getId (): string {
		return this._id;
	}

	awake (): void {
		this._gameObject.setInteractive({ useHandCursor: true });
	}

	start (): void {
		this._gameObject.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, this._handleClick);
	}

	destroy (): void {
		this._gameObject.disableInteractive();
		this._gameObject.off(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, this._handleClick);
	}

}