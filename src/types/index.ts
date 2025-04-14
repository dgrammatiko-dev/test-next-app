export interface Business {
  id: number;
  name: string;
  type: "bar"| "restaurant" | "club" | "hotel"  | "cafe";
  location: string;
}

export interface StaffMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  position: "kitchen" | "service" | "PR";
  bussinesId: number;
}
