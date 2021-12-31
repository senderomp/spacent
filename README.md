page: https://senderomp.github.io/spacent/
Spacent is the environment where users can create spaces, which can be rented by the hour, when creating it, you must set the days and hours it will be available, identify it with a name, and set a reservation fee per hour, once the space is created, any other user can reserve it for the fee indicated, and in this way, is the only person who can use the space on the day and date reserved.

# Solidity Contract Methods
createSpace: Recieves the info of the space to create, and adds it to the contract, also, iterates the slots tho create them
getSlot: Returns the info of the slot by the index of the slot
getSlotsLength: Returns the length of slots
getSpace: Returns the info of a space by his index
getSpacesLength: Returns the length of spaces
reserveSlot: Pays the price of reservation to the owner of the space, and registers the address as the one that occupies the slot 

# Install

```

npm install

```

or 

```

yarn install

```

# Start

```

npm run dev

```

# Build

```

npm run build

```
# Usage
1. Install the [CeloExtensionWallet](https://chrome.google.com/webstore/detail/celoextensionwallet/kkilomkmpmkbdnfelcpgckmpcaemjcdh?hl=en) from the google chrome store.
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet in the CeloExtensionWallet.
