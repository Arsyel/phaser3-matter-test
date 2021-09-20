import shortUUID from "short-uuid";
import { Component } from "../modules/services/ComponentService";

export class ResetPositionComponent implements Component {

	private _gameObject: Phaser.GameObjects.Image;
	private _id: string;

	init (go: Phaser.GameObjects.Image): void {
		this._id = go.name + "_" + shortUUID.generate();
		this._gameObject = go;
	}

	getId (): string {
		return this._id;
	}

	start (): void {
		this._gameObject.setOrigin(0.5).setPosition(0, 0);
	}

}