private var demand: Subscribers.Demand = .none

func request(_ demand: Subscribers.Demand) {
    self.demand += demand
    fulfillDemand()
}