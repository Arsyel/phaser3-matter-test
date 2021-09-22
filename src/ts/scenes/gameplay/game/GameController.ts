import { GameState } from "../../../info/GameInfo";

type OnTimerUpdate = (time: number) => void;
type OnInitialization = (initTime: number) => void;
type OnComboActive = (combo: number) => void;

export const enum EvenNames {
  onInitialization = "onInitialization",
  onTimerUpdate = "onTimerUpdate",
  onTimeout = "onTimeout",
  onComboActive = "onComboActive",
  onComboDeactive = "onComboDeactive",
};

export class GameController {

  private _event: Phaser.Events.EventEmitter;
  private _state: GameState;

  private _score: number;

  private _timer: number;
  private _baseTimer: number;
  private _time: number;

  private _combo: number;
  private _comboTime: number;
  private _isActiveCombo: boolean;

  constructor () {
    this._event = new Phaser.Events.EventEmitter();
    this._state = GameState.PREPARING;

    this._score = 0;

    this._timer = 0;
    this._baseTimer = 0;

    this._combo = 0;
    this._comboTime = 1;
    this._isActiveCombo = false;
  }

  init (timer: number): void {
    this._state = GameState.PLAYING;
    this._timer = timer;
    this._baseTimer = timer;
    this._time = 60;
    this._event.emit(EvenNames.onInitialization, this._time);
  }

  get score (): number {
    return this._score <= 0 ? 0 : this._score;
  }

  get state (): GameState {
    return this._state;
  }

  setGameOverState (): void {
    this._state = GameState.GAMEOVER;
  }

  addScore (value: number = 1): void {
    this._score += value;
  }

  addCombo (): void {
    this._combo += 1;
    this._comboTime = 1;
    this._isActiveCombo = true;
    this._event.emit(EvenNames.onComboActive, this._combo);
  }

  update (time: number, dt: number): void {
    if (this._state === GameState.GAMEOVER) return;

    const delta = dt / 1000;
    this._timer -= delta;
    if (this._timer <= 0) {
      this._timer += this._baseTimer;
      this._time -= 1;
      this._event.emit(EvenNames.onTimerUpdate, this._time);

      (this._time <= 0) && this._event.emit(EvenNames.onTimeout);
    }

    if (this._isActiveCombo) {
      this._comboTime -= delta;
      if (this._comboTime <= 0) {
        this._combo = 0;
        this._comboTime += 1;
        this._isActiveCombo = false;
        this._event.emit(EvenNames.onComboDeactive);
      }
    }
  }

  onInitialization (event: OnInitialization): void {
    this._event.once(EvenNames.onInitialization, event);
  }

  onTimerUpdate (events: OnTimerUpdate): void {
    this._event.on(EvenNames.onTimerUpdate, events);
  }

  onTimeout (events: Function): void {
    this._event.on(EvenNames.onTimeout, events);
  }

  onComboActive (events: OnComboActive): void {
    this._event.on(EvenNames.onComboActive, events);
  }

  onComboDeactive (events: Function): void {
    this._event.on(EvenNames.onComboDeactive, events);
  }

}