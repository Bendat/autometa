Feature: Datatables

  Scenario: HTable
    Given a table
      | name    | director      |
      | alien   | Ridley Scott  |
      | titanic | James Cameron |

  Scenario: VTable
    Given a table
      | name     | alien        | titanic       |
      | director | Ridley Scott | James Cameron |

  Scenario: ListTable
    Given a table
      | alien   | Ridley Scott  |
      | titanic | James Cameron |

  Scenario: MTable
    Given a table
      |        | green | blue   | red        |
      | large  | hill  | ocean  | ularu      |
      | medium | tree  | pond   | fire truck |
      | small  | grass | puddle | raspberry  |
