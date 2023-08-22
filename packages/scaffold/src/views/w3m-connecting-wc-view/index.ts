import type { Platform } from '@web3modal/core'
import {
  ConnectionController,
  ConnectorController,
  ConstantsUtil,
  CoreHelperUtil,
  ModalController,
  RouterController,
  SnackController,
  StorageUtil
} from '@web3modal/core'
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { animate } from 'motion'

@customElement('w3m-connecting-wc-view')
export class W3mConnectingWcView extends LitElement {
  // -- Members ------------------------------------------- //
  private interval?: ReturnType<typeof setInterval> = undefined

  private lastRetry = Date.now()

  private wallet = RouterController.state.data?.wallet

  // -- State & Properties -------------------------------- //
  @state() private platform?: Platform = undefined

  @state() private platforms: Platform[] = []

  public constructor() {
    super()
    this.initializeConnection()
    this.interval = setInterval(this.initializeConnection.bind(this), ConstantsUtil.TEN_SEC_MS)
  }

  public override disconnectedCallback() {
    clearTimeout(this.interval)
  }

  // -- Render -------------------------------------------- //
  public override render() {
    if (!this.wallet) {
      return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
    }

    this.determinePlatforms()

    return html`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
    `
  }

  // -- Private ------------------------------------------- //
  private async initializeConnection(retry = false) {
    try {
      const { wcPairingExpiry } = ConnectionController.state
      if (retry || CoreHelperUtil.isPairingExpired(wcPairingExpiry)) {
        ConnectionController.connectWalletConnect()
        await ConnectionController.state.wcPromise
        this.storeWalletConnectDeeplink()
        ModalController.close()
      }
    } catch {
      if (CoreHelperUtil.isAllowedRetry(this.lastRetry)) {
        SnackController.showError('Declined')
        this.lastRetry = Date.now()
        this.initializeConnection(true)
      }
    }
  }

  private storeWalletConnectDeeplink() {
    const { wcLinking } = ConnectionController.state
    if (wcLinking) {
      StorageUtil.setWalletConnectDeepLink(wcLinking)
    }
  }

  private determinePlatforms() {
    if (!this.wallet) {
      throw new Error('w3m-connecting-wc-view:determinePlatforms No wallet')
    }

    if (this.platform) {
      return
    }

    const { connectors } = ConnectorController.state
    const { mobile_link, desktop_link, webapp_link, injected } = this.wallet
    const injectedIds = injected?.map(({ injected_id }) => injected_id) ?? []
    const isInjected = injectedIds.length
    const isMobileWc = mobile_link
    const isWebWc = webapp_link
    const isInjectedConnector = connectors.find(c => c.type === 'INJECTED')
    const isInjectedInstalled = ConnectionController.checkInjectedInstalled(injectedIds)
    const isInjectedWc = isInjected && isInjectedInstalled && isInjectedConnector
    const isDesktopWc = desktop_link && !CoreHelperUtil.isMobile()

    // Populate all preferences
    if (isInjectedWc) {
      this.platforms.push('injected')
    }
    if (isMobileWc) {
      this.platforms.push(CoreHelperUtil.isMobile() ? 'mobile' : 'qrcode')
    }
    if (isWebWc) {
      this.platforms.push('web')
    }
    if (isDesktopWc) {
      this.platforms.push('desktop')
    }
    if (!isInjectedWc && isInjected) {
      this.platforms.push('unsupported')
    }

    this.platform = this.platforms[0]
  }

  private platformTemplate() {
    const multiPlatform = this.platforms.length > 1

    if (!this.platform) {
      return null
    }

    switch (this.platform) {
      case 'injected':
        return html`
          <w3m-connecting-wc-injected .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-injected>
        `
      case 'desktop':
        return html`
          <w3m-connecting-wc-desktop .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-desktop>
        `
      case 'web':
        return html`
          <w3m-connecting-wc-web .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-web>
        `
      case 'mobile':
        return html`
          <w3m-connecting-wc-mobile .multiPlatfrom=${multiPlatform}></w3m-connecting-wc-mobile>
        `
      case 'qrcode':
        return html`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`
      default:
        return html`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`
    }
  }

  private headerTemplate() {
    const multiPlatform = this.platforms.length > 1

    if (!multiPlatform) {
      return null
    }

    return html`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `
  }

  private async onSelectPlatform(platform: Platform) {
    const container = this.shadowRoot?.querySelector('div')
    if (container) {
      await animate(container, { opacity: [1, 0] }, { duration: 0.2 }).finished
      this.platform = platform
      animate(container, { opacity: [0, 1] }, { duration: 0.2 })
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connecting-wc-view': W3mConnectingWcView
  }
}