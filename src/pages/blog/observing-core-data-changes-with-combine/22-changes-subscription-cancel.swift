func cancel() {
    fetchedResultsController?.delegate = nil
    fetchedResultsController = nil
}