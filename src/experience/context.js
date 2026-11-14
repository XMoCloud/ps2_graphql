import { createContext, useContext } from "react";
// Separate from the refreshable provider so development edits retain identity.
export const ExperienceContext = createContext(null);
export const useExperience = () => useContext(ExperienceContext);
