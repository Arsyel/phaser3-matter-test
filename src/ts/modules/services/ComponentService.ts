import shortUUID from "short-uuid";

export type Constructor<T extends {} = {}> = new (...args: any[]) => T

export interface Component {

	init (go: Phaser.GameObjects.GameObject): void;
	getId: () => string;
	awake?: () => void;
	start?: () => void;
	update?: (dt: number) => void;
	destroy?: () => void;

}

export class ComponentService {

	private _componentsByGameObject = new Map<string, Component[]>();
	private _queuedForStart: Component[] = [];

	addComponent (go: Phaser.GameObjects.GameObject, component: Component): void {
		if (!go.name) {
			go.setName(go.type + "_" + shortUUID.generate());
		}

		if (!this._componentsByGameObject.has(go.name)) {
			this._componentsByGameObject.set(go.name, []);
		}

		const components = this._componentsByGameObject.get(go.name)!;
		components.push(component);

		component.init(go);
		if (component.awake) component.awake();

		if (component.start) {
			this._queuedForStart.push(component);
		}
	}

	addComponents (go: Phaser.GameObjects.GameObject, components: Component[]): void {
		for (let index = 0; index < components.length; index++) {
			const component = components[index];
			this.addComponent(go, component);
		}
	}

	findComponent<ComponentType> (go: Phaser.GameObjects.GameObject, componentType: Constructor<ComponentType>): Component | null {
		const components = this._componentsByGameObject.get(go.name);
		if (!components) return null;
		return (components.find((component) => component instanceof componentType) ?? null);
	}

	findComponents<ComponentType> (go: Phaser.GameObjects.GameObject, componentType: Constructor<ComponentType>): Component[] {
		const components = this._componentsByGameObject.get(go.name);
		if (!components) return [];
		return (components.filter((component) => component instanceof componentType));
	}

	removeComponent<ComponentType> (go: Phaser.GameObjects.GameObject, componentType: Constructor<ComponentType> | string): boolean {
		const components = this._componentsByGameObject.get(go.name);
		const targetComponent = (typeof componentType === "string")
			? components?.find((component) => component.getId() === componentType)
			: components?.find((component) => component instanceof componentType);
		if (components && targetComponent) {
			if (targetComponent.destroy) targetComponent.destroy();
			this._componentsByGameObject.set(go.name, components.filter((component) => component != targetComponent));
			return true;
		}
		return false;
	}

	update (dt: number): void {
		while (this._queuedForStart.length > 0) {
			const component = this._queuedForStart.shift()!;
			if (component.start) component.start();
		}

		const values = this._componentsByGameObject.values();
		for (const components of values) {
			components.forEach((component) => {
				if (component.update) component.update(dt);
			});
		}
	}

	destroy (): void {
		const values = this._componentsByGameObject.values();
		for (const components of values) {
			components.forEach((component) => {
				if (component.destroy) component.destroy();
			});
		}
	}

}