import preact from 'preact';
import autoBind from '../../utils/auto-bind';

const { Component } = preact;

export default class ShepherdModal extends Component {
  constructor(props) {
    super(props);

    this._onScreenChange = null;

    this.classPrefix = props.classPrefix;

    autoBind(this);

    // Setup initial state
    this.closeModalOpening();
  }

  render(props, state) {
    const { classPrefix, styles } = props;
    return <svg
      className={styles['modal-overlay-container']}
      onTouchMove={ShepherdModal._preventModalOverlayTouch}
    >
      <defs>
        <mask
          className={`${classPrefix}shepherd-modal-mask`}
          height='100%'
          id={`${classPrefix}shepherd-modal-mask`}
          width='100%'
          x='0'
          y='0'
        >
          <rect
            className={styles['modal-mask-rect']}
            fill='#FFFFFF'
            height='100%'
            width='100%'
            x='0'
            y='0'
          />

          <rect
            className={`${classPrefix}shepherd-modal-mask-opening`}
            fill='#000000'
            height={state.openingProperties.height}
            x={state.openingProperties.x}
            y={state.openingProperties.y}
            width={state.openingProperties.width}
          />
          {state.openingProperties.image > 0 &&
            <image
              height={state.openingProperties.height}
              x={state.openingProperties.x}
              y={state.openingProperties.y}
              width={state.openingProperties.width}
            ><use xlinkHref={state.openingProperties.image} />
            </image>
          }
        </mask>
      </defs>
      <rect
        height='100%'
        width='100%'
        x='0'
        y='0'
        mask={`url(#${classPrefix}shepherd-modal-mask)`}
      />
    </svg>;
  }

  closeModalOpening() {
    this.setState({
      openingProperties: {
        height: 0,
        x: 0,
        y: 0,
        width: 0
      }
    });
  }

  /**
   * Hide the modal overlay
   */
  hide() {
    document.body.classList.remove(`${this.classPrefix}shepherd-modal-is-visible`);

    // Ensure we cleanup all event listeners when we hide the modal
    this._cleanupStepEventListeners();
  }

  /**
   * Uses the bounds of the element we want the opening overtop of to set the dimensions of the opening and position it
   * @param {HTMLElement} targetElement The element the opening will expose
   * @param {Number} modalOverlayOpeningPadding An amount of padding to add around the modal overlay opening
   */
  positionModalOpening(targetElement, modalOverlayOpeningPadding = 0, modalOverlayOpeningImage = "") {
    if (targetElement.getBoundingClientRect) {
      const { x, y, width, height, left, top } = targetElement.getBoundingClientRect();

      // getBoundingClientRect is not consistent. Some browsers use x and y, while others use left and top
      this.setState({
        openingProperties: {
          x: (x || left) - modalOverlayOpeningPadding,
          y: (y || top) - modalOverlayOpeningPadding,
          width: (width + (modalOverlayOpeningPadding * 2)),
          height: (height + (modalOverlayOpeningPadding * 2)),
          image: modalOverlayOpeningImage,
        }
      });
    }
  }

  /**
   * If modal is enabled, setup the svg mask opening and modal overlay for the step
   * @param {Step} step The step instance
   */
  setupForStep(step) {
    // Ensure we move listeners from the previous step, before we setup new ones
    this._cleanupStepEventListeners();

    if (step.tour.options.useModalOverlay) {
      this._styleForStep(step);
      this.show();

    } else {
      this.hide();
    }
  }

  /**
   * Show the modal overlay
   */
  show() {
    document.body.classList.add(`${this.classPrefix}shepherd-modal-is-visible`);
  }

  /**
   * Add touchmove event listener
   * @private
   */
  _addStepEventListeners() {
    // Prevents window from moving on touch.
    window.addEventListener('touchmove', ShepherdModal._preventModalBodyTouch, {
      passive: false
    });
  }

  /**
   * Cancel the requestAnimationFrame loop and remove touchmove event listeners
   * @private
   */
  _cleanupStepEventListeners() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    window.removeEventListener('touchmove', ShepherdModal._preventModalBodyTouch, {
      passive: false
    });
  }

  /**
   * Style the modal for the step
   * @param {Step} step The step to style the opening for
   * @private
   */
  _styleForStep(step) {
    const { modalOverlayOpeningPadding } = step.options;
    const { modalOverlayOpeningImage } = step.options;

    if (step.target) {
      // Setup recursive function to call requestAnimationFrame to update the modal opening position
      const rafLoop = () => {
        this.rafId = undefined;
        this.positionModalOpening(step.target, modalOverlayOpeningPadding, modalOverlayOpeningImage);
        this.rafId = requestAnimationFrame(rafLoop);
      };

      rafLoop();

      this._addStepEventListeners();
    } else {
      this.closeModalOpening();
    }
  }

  static _preventModalBodyTouch(e) {
    e.preventDefault();
  }

  static _preventModalOverlayTouch(e) {
    e.stopPropagation();
  }
}
