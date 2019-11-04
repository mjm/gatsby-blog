extension Publisher {
    func apply<Section, Item, Animate: Publisher>(
        to dataSource: UITableViewDiffableDataSource<Section, Item>,
        animate: Animate? = nil
    )
        -> AnyCancellable
    where
        Output == NSDiffableDataSourceSnapshot<Section, Item>,
        Animate.Output == Bool,
        Failure == Never,
        Animate.Failure == Never
    {
        // Animate and Just are different types, so we have to type-erase to be able to use
        // either one for the same parameter.
        let animate = animate?.eraseToAnyPublisher() ?? Just(true).eraseToAnyPublisher()
        return combineLatest(animate).sink { snapshot, animate in
            dataSource.apply(snapshot, animatingDifferences: animate)
        }
    }
}