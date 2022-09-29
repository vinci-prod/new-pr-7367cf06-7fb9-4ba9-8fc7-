
const VINCI_ENV = sessionStorage.getItem('vinciEnv');
const BASE_URL = VINCI_ENV === 'dev' ? 'http://localhost:5001/vinci-dev-6e577/us-central1/api/public' :
    'https://us-central1-vinci-dev-6e577.cloudfunctions.net/api/public';
const PROJECT_ID = 'new-pr-7367cf06-7fb9-4ba9-8fc7-'
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

const fetchUsers = () => {
    console.log(window.location.href.split('/')[window.location.href.split('/').length - 1]);
    console.log(window.location.href);
    axios.get(BASE_URL, {
        params: {
            url: window.location.href,
            API_KEY: 'VINCI_DEV_6E577'
        }, headers: { "Access-Control-Allow-Origin": "*" }
    })
        .then(response => {
            const users = response.data.data;
        })
        .catch(error => console.error(error));
};

const logPageView = () => {
    if (PROJECT_ID === "{{projectId}}") return;
    axios.post(BASE_URL + '/onboardingview', {
        projectId: PROJECT_ID,
        requestURL: window.location.href,
        API_KEY: 'VINCI_DEV_6E577'
    });
}

/**
 * Setup the orchestra
 */
function init() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "7550f76d68824553876499772c39974a",
            }
        },
    };
    web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
        disableInjectedProvider: false
    });
    console.log("Web3Modal instance is", web3Modal);
}

function getProvider() {
    if ("phantom" in window) {
        const provider = window.phantom?.solana;

        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open("https://phantom.app/", "_blank");
}

async function refreshAccountData(event) {

    await fetchAccountData(provider, event);
}
/**
 * Connect wallet button pressed.
 */
async function onConnect(event) {
    console.log("Opening a dialog", web3Modal);
    try {
        provider = await web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData(event);
    });
    provider.on("chainChanged", (chainId) => {
        fetchAccountData(event);
    });
    provider.on("networkChanged", (networkId) => {
        fetchAccountData(event);
    });

    await refreshAccountData(event);

}

async function onSolConnect(event) {
    event.preventDefault();
    const provider = getProvider();
    try {
        provider.connect().then((resp) => {
            console.log(resp.publicKey.toString());
            const connectButton = document.getElementById("sol");
            connectButton.innerHTML = window.solana.publicKey;
            console.log(provider);
            status.innerHTML = provider.isConnected.toString();
            const data = document.querySelector("#sol");
            const res = check_user_NFT(resp.publicKey.toString(), data.dataset.address)
            if (res) {
                location.href = data.dataset.href;
            }
        });
    } catch (err) {
        console.log(err);
    }
}

/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData(event) {
    // Get a Web3 instance for the wallet
    const web3 = new Web3(provider);
    console.log("Web3 instance is", web3);
    // Get connected chain id from Ethereum node
    const chainId = await web3.eth.getChainId();
    // Load chain information over an HTTP API
    const chainData = evmChains.getChain(chainId);
    // Get list of accounts of the connected wallet
    const accounts = await web3.eth.getAccounts();
    // MetaMask does not give you all accounts, only the selected account
    console.log("Got accounts", accounts);
    selectedAccount = accounts[0];
    const data = document.querySelector("#eth");
    const res = check_user_NFT(selectedAccount, data.dataset.address)
    if (res) {
        location.href = data.dataset.href;
    }
}


async function check_user_NFT(user_address, token_address, provider_uri) {
    const opensea_uri = 'https://api.opensea.io/api/v1/assets?owner=' + user_address;
    const response = await axios.get(opensea_uri);
    const data = response.data.assets;
    console.log(data);
    for (var i = 0; i < data.length; i++) {
        if (data[i].asset_contract.address === token_address) {
            console.log('true');
            return true;
        }
    }
    return false;
}


logPageView();

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
    init();
    document.querySelector("#eth").addEventListener("click", onConnect);
    document.querySelector("#sol").addEventListener("click", onSolConnect);
});
