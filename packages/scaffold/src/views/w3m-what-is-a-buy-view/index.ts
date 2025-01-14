import { customElement } from '@web3modal/ui'
import { RouterController } from '@web3modal/core'
import { LitElement, html } from 'lit'

@customElement('w3m-what-is-a-buy-view')
export class W3mWhatIsABuyView extends LitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <wui-flex
        flexDirection="column"
        .padding=${['xxl', '3xl', 'xl', '3xl'] as const}
        alignItems="center"
        gap="xl"
      >
        <wui-visual name="onrampCard"></wui-visual>
        <wui-flex flexDirection="column" gap="xs">
          <wui-text align="center" variant="paragraph-500" color="fg-100">
            Buy assets to unlock your trade opportunities
          </wui-text>
          <wui-text align="center" variant="small-400" color="fg-200"
            >With on-ram Buy, simply buy crypto with fiat via credit card or bank transfer and add
            funds in your wallet to trade</wui-text
          >
        </wui-flex>
        <wui-button @click=${RouterController.goBack}>
          <wui-icon size="sm" color="inherit" name="add" slot="iconLeft"></wui-icon>
          Buy
        </wui-button>
      </wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-what-is-a-buy-view': W3mWhatIsABuyView
  }
}
