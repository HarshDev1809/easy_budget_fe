import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { Footer } from "./Footer";

describe("Landing Components", () => {
  describe("Navbar", () => {
    it("renders the logo and application name", () => {
      render(<Navbar />);
      expect(screen.getByText("EasyBudget")).toBeInTheDocument();
      expect(screen.getByText("E")).toBeInTheDocument();
    });

    it("renders core navigation links", () => {
      render(<Navbar />);
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("How it Works")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
    });

    it("renders the start for free button link", () => {
      render(<Navbar />);
      const buttonLink = screen.getByRole("link", { name: "Start for free" });
      expect(buttonLink).toBeInTheDocument();
      expect(buttonLink).toHaveAttribute("href", "/get-started");
    });
  });

  describe("Hero", () => {
    it("renders the hero headline and subtext", () => {
      render(<Hero />);
      expect(screen.getByText(/Master your money with/i)).toBeInTheDocument();
      expect(screen.getByText(/effortless precision./i)).toBeInTheDocument();
      expect(
        screen.getByText(/Take control of your finances without the complexity/i)
      ).toBeInTheDocument();
    });

    it("renders the primary CTA button", () => {
      render(<Hero />);
      const ctaButton = screen.getByRole("link", { name: /Get Started Today/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute("href", "/get-started");
    });
  });

  describe("Features", () => {
    it("renders section header details", () => {
      render(<Features />);
      expect(
        screen.getByText("Everything you need. Nothing you don't.")
      ).toBeInTheDocument();
    });

    it("renders the list of key features", () => {
      render(<Features />);
      expect(screen.getByText("Intuitive Analytics")).toBeInTheDocument();
      expect(screen.getByText("Lightning Fast")).toBeInTheDocument();
      expect(screen.getByText("Bank-Grade Security")).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders branding description and copyright", () => {
      render(<Footer />);
      expect(
        screen.getByText(/Empowering individuals to achieve financial clarity/i)
      ).toBeInTheDocument();
      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(`© ${currentYear} EasyBudget Inc.`, "i"))
      ).toBeInTheDocument();
    });

    it("renders social icon links", () => {
      render(<Footer />);
      expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
      expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
      expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
    });
  });
});
