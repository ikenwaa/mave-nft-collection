export default function handler(req, res) {
    const tokenId = req.query.tokenId;
    // Extract images from GitHub repository
    const img_url = "https://raw.githubusercontent.com/ikenwaa/mave-nft-collection/main/mave-nft-collection/public/mavedevs/";

    // The API is sending back metadata for a Mave Dev NFT
    // To make our collection compatible with Opensea, we need to follow some Metadata standards
    // when sending back the response from the api.
    res.status(200).json({
        name: "Mave Dev #" + tokenId,
        description: "Mave Dev NFT is a collection of NFTs for the Mave ecosystem.",
        image: img_url + tokenId + ".svg"
    });
}