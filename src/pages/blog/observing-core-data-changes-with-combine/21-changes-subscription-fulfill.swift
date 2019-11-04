private func fulfillDemand() {
    if demand > 0 && !currentDifferences.isEmpty {
        let newDemand = downstream.receive(currentDifferences)

        lastSentState = Array(fetchedResultsController?.fetchedObjects ?? [])
        currentDifferences = lastSentState.difference(from: lastSentState)

        demand += newDemand
        demand -= 1
    }
}