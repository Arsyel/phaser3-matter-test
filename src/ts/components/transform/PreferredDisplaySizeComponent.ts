import shortUUID from "short-uuid";
import { Component } from "../../modules/services/ComponentService";

type GameObject = (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform) | Phaser.GameObjects.Rectangle

type PreferredSizeType = "MIN" | "MAX"

type DisplaySizeRef = {
	width: number,
	height: number
}

export class PreferredDisplaySizeComponent implements Component {

	private _gameObject: GameObject;
	private _id: string;
	private _type: PreferredSizeType;
	private _displaSizeRef: DisplaySizeRef;

	constructor (type: PreferredSizeType, width: number, height: number) {
		this._type = type;
		this._displaSizeRef = { width, height };
	}

	init (go: GameObject): void {
		this._id = go.name + "_" + shortUUID.generate();
		this._gameObject = go;
	}

	getId (): string {
		return this._id;
	}

	awake (): void {
		if (this._type === "MIN") {
			this.setMinPreferredDisplaySize(this._displaSizeRef.width, this._displaSizeRef.height);
		}
		else if (this._type === "MAX") {
			this.setMaxPreferredDisplaySize(this._displaSizeRef.width, this._displaSizeRef.height);
		}
	}

	private get heightAspectRatio (): number {
		return this._gameObject.height / this._gameObject.width;
	}

	private get widthAspectRatio (): number {
		return this._gameObject.width / this._gameObject.height;
	}

	private setDisplayHeightToAspectRatio (): void {
		this._gameObject.displayHeight = this._gameObject.displayWidth * this.heightAspectRatio;
	}

	private setDisplayWidthToAspectRatio (): void {
		this._gameObject.displayWidth = this._gameObject.displayHeight * this.widthAspectRatio;
	}

	private setDisplayWidth (width: number, matchHeightToAspectRatio = false): void {;
		this._gameObject.displayWidth = width;
		if (matchHeightToAspectRatio) {
			this.setDisplayHeightToAspectRatio();
		}
	}

	private setDisplayHeight (height: number, matchWidthToAspectRatio = false): void {
		this._gameObject.displayHeight = height;
		if (matchWidthToAspectRatio) {
			this.setDisplayWidthToAspectRatio();
		}
	}

	private setMinPreferredDisplaySize (minWidth: number, minHeight: number): void {
		if (minWidth * this.heightAspectRatio < minHeight) {
			this.setDisplayHeight(minHeight, true);
		}
		else {
			this.setDisplayWidth(minWidth, true);
		}
	}

	private setMaxPreferredDisplaySize (maxWidth: number, maxHeight: number): void {
		if (maxWidth * this.heightAspectRatio > maxHeight) {
			this.setDisplayHeight(maxHeight, true);
		}
		else {
			this.setDisplayWidth(maxWidth, true);
		}
	}

}