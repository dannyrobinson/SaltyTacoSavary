import { ChalkBoard, ChalkMenuItem } from "@saltytaco/design-system";

export const TacoMenu = () => (
  <ChalkBoard title="Tacos">
    <ul>
      <ChalkMenuItem
        name="Beef Taco"
        price="$25"
        chalk="orange"
        description='1 × 10" flour tortilla, cheese, fresh lettuce, tomato, avocado, chipotle sauce'
      />
      <ChalkMenuItem
        name="Fish Tacos"
        price="$18 / 2 for $30"
        chalk="blue"
        description='2 × 6" corn tortillas, corn-crusted fish, mango salsa, avocado crema'
      />
      <ChalkMenuItem
        name="Veggie Tacos"
        price="$15 / 2 for $25"
        chalk="green"
        description='2 × 6" corn tortillas, pan-fried cauliflower, cabbage, chipotle sauce'
      />
    </ul>
  </ChalkBoard>
);

export const WithFlourish = () => (
  <ChalkBoard title="Ice Cream & Snacks" flourish="DELICIOUS!!!">
    <ul>
      <ChalkMenuItem name="Single Cone or Cup" price="$6" chalk="pink" />
      <ChalkMenuItem name="Waffle Cone" price="$10" chalk="blue" />
      <ChalkMenuItem name='"Salty Taco" Slushy (20oz)' price="$10" chalk="yellow" />
    </ul>
  </ChalkBoard>
);
