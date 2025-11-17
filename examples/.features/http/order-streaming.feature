Feature: Stream order preparation events
  Brew Buddy emits server-sent events so baristas can track order progress in real time.

  Background:
    Given the Brew Buddy API base URL is configured
    And the SSE client is connected to "/orders/stream"

  Rule: Streaming events reflect order lifecycle
    Scenario: Receive updates for a queued order
      Given an order exists with ticket "TCK-1001"
      When the kitchen updates the order status sequence
        | status   |
        | queued   |
        | brewing  |
        | ready    |
      Then the streamed events should arrive in order for ticket "TCK-1001"
        | event   | data.status |
        | queued  | queued      |
        | brewing | brewing     |
        | ready   | ready       |

    Scenario: Stream includes completion metadata
      Given an order exists with ticket "TCK-2002"
      When the kitchen marks the order as completed with pickup code "AB12"
      Then the streamed events should include an event "completed" with data
        | path           | value  |
        | ticket         | TCK-2002 |
        | pickupCode     | AB12   |
        | completedAt    | <timestamp> |

  Rule: Streaming errors are surfaced to clients
    Scenario: Notify clients when the stream breaks
      Given the SSE connection is interrupted
      When I await the next stream event
      Then I should receive a stream error containing "CONNECTION_LOST"

    Scenario: Unknown event types are ignored with warnings
      When the stream emits an event "unexpected"
      Then the client should log a warning containing "unexpected"
      And the client should continue processing subsequent events
