func controllerDidChangeContent(
    _ controller: NSFetchedResultsController<NSFetchRequestResult>
) {
    updateDiff()
}

private var lastSentState: [Object] = []
private var currentDifferences = CollectionDifference<Object>([])!

private func updateDiff() {
    currentDifferences
        = Array(fetchedResultsController?.fetchedObjects ?? [])
            .difference(from: lastSentState)

    fulfillDemand()
}