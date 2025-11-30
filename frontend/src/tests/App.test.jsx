import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Komponens', () => {
  it('Megjeleníti a főcímet', () => {
    render(<App />);
    
    // HIBA JAVÍTÁSA:
    // A 'getByText' hibát dob, ha több elem is van.
    // A 'getAllByText' egy tömböt ad vissza az összes találattal.
    const headingElements = screen.getAllByText(/Bajnokság app/i);
    
    // Azt ellenőrizzük, hogy talált-e legalább egy ilyen szöveget
    expect(headingElements.length).toBeGreaterThan(0);
  });

  it('Megjeleníti a navigációs gombokat', () => {
    render(<App />);
    
    // Itt is a biztonságosabb getAllByText-et használjuk
    const adminButtons = screen.getAllByText(/Admin bejelentkezés/i);
    
    // Ellenőrizzük, hogy van-e találat, és az első elem a dokumentumban van-e
    expect(adminButtons.length).toBeGreaterThan(0);
    expect(adminButtons[0]).toBeInTheDocument();
  });
});