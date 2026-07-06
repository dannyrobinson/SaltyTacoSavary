import { ChalkBoard, ChalkMenuItem } from "@saltytaco/design-system";

// ChalkMenuItem is chalk on a board — rendered inside its ChalkBoard parent,
// the only context where it's legible.
export const ChalkColours = () => (
  <ChalkBoard>
    <ul>
      <ChalkMenuItem name="Chicken Strips & Fries" price="$25" chalk="orange" />
      <ChalkMenuItem name="Poutine" price="$17" chalk="blue" />
      <ChalkMenuItem name="Small Fries" price="$10" chalk="yellow" />
      <ChalkMenuItem name="Onion Rings" price="$12" chalk="green" />
      <ChalkMenuItem name="Cotton Candy Ice Cream" price="$6" chalk="pink" />
    </ul>
  </ChalkBoard>
);

export const WithDescription = () => (
  <ChalkBoard>
    <ul>
      <ChalkMenuItem
        name="Chicken Fajita Taco"
        price="$25"
        chalk="yellow"
        description='1 × 10" flour tortilla, fresh fried peppers & onions, cheese, avocado, salsa'
      />
    </ul>
  </ChalkBoard>
);
