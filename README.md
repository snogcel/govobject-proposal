# govobject-proposal

int GetBudgetPaymentCycleBlocks(){
    // Amount of blocks in a months period of time (using 2.6 minutes per) = (60*24*30)/2.6
    if(Params().NetworkID() == CBaseChainParams::MAIN) return 16616;
    //for testing purposes

    return 50; //ten times per day
}



    if(strCommand == "nextblock")
    {
        CBlockIndex* pindexPrev = chainActive.Tip();
        if(!pindexPrev) return "unknown";

        int nNext = pindexPrev->nHeight - pindexPrev->nHeight % GetBudgetPaymentCycleBlocks() + GetBudgetPaymentCycleBlocks();
        return nNext;
    }