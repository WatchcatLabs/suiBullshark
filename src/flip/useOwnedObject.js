const { fetchKiosk } = require('@mysten/kiosk');
const { Connection, JsonRpcProvider } = require('@mysten/sui.js');

// type: "0xee496a0cc04d06a345982ba6697c90c619020de9e274408c7819f787ff66e1a1::suifrens::SuiFren<0x8894fa02fc6f36cbc485ae9145d05f247a78e220814fb8419ab261bd81f08f32::bullshark::Bullshark>"
const BULLSHARK_NFT_TYPE =
    '0xee496a0cc04d06a345982ba6697c90c619020de9e274408c7819f787ff66e1a1::suifrens::SuiFren<0x8894fa02fc6f36cbc485ae9145d05f247a78e220814fb8419ab261bd81f08f32::bullshark::Bullshark>';

async function useOwnedObject(address, type) {
    let ownedObject = null;

    const FULL_NODE = 'https://fullnode.mainnet.sui.io/';
    const KIOSK_TYPE = '0x2::kiosk::Kiosk';

    if (!address || !type) {
        return null;
    }

    const provider = new JsonRpcProvider(
        new Connection({
            fullnode: FULL_NODE,
        })
    );

    const { data: ownedObjects } = await provider.getOwnedObjects({
        owner: address,
        options: { showContent: true },
    });

    for (const object of ownedObjects) {
        const { data } = object;
        if (!data?.objectId) {
            continue;
        }

        const { content: objectContent } = data;

        ownedObject = {
            objectId: data?.objectId,
        };

        console.log("objectContent: %s", objectContent)
        if (objectContent && objectContent.type === KIOSK_TYPE) {
            const { fields } = objectContent;
            const { data: kioskItems } = await fetchKiosk(
                provider,
                fields.for,
                {},
                { withListingPrices: true, withKioskFields: true }
            );

            const ownedObjectCandidate = kioskItems.items.find((item) => item.type === type);
            if (ownedObjectCandidate) {
                ownedObject = { objectId: ownedObjectCandidate.objectId, kiosk: fields.for };
            }
        }
    }

    console.log('ownedObject:', ownedObject);
    return ownedObject;
}

async function main() {
    const ownedObject = await useOwnedObject(
        '0xb189f109001de2eca01bbf5a45525c8c0fbc2517ff8aae2862d9c016214345d1',
        BULLSHARK_NFT_TYPE
    );
    console.log("ownedObject")
}

main();

module.exports = {
    useOwnedObject,
}