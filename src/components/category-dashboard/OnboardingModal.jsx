'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import { useAtom } from 'jotai';
import { planAtom } from '../state/atoms';
import { v4 as uuidv4 } from 'uuid';
import {
  createCategory,
  createSubcategory,
  setOnboardingStatus,
} from './serverActions';

// Define the available onboarding strategies and their default buckets
const strategies = [
  {
    id: '50-30-20',
    label: '50/30/20 Budget',
    categories: [
      {
        name: 'Needs',
        subcategories: [
          'Rent / Mortgage',
          'Utilities',
          'Groceries',
          'Gas',
          'Insurance',
          'Healthcare',
          'Childcare',
          'Giving',
          'Debt Payments',
          'Car Payment',
        ],
      },
      {
        name: 'Wants',
        subcategories: [
          'Dining Out',
          'Entertainment',
          'Subscriptions',
          'Personal Care & Wellness',
          'Shopping',
          'Travel',
        ],
      },
    ],
  },
  {
    id: 'conscious-spending',
    label: 'Conscious Spending Plan',
    categories: [
      {
        name: 'Fixed Costs',
        subcategories: [
          'Rent / Mortgage',
          'Utilities',
          'Insurance',
          'Debt Payments',
          'Childcare',
          'Giving',
          'Medical',
          'Home Maintenance',
          'Groceries',
          'Gas',
          'Transportation',
          'Car Payment',
        ],
      },
      {
        name: 'Investments',
        subcategories: ['Retirement', 'Roth IRA', 'Brokerage'],
      },
      {
        name: 'Guilt-Free Spending',
        subcategories: [
          'Dining Out',
          'Date Night',
          'Entertainment',
          'Hobbies',
          'Self-Care & Wellness',
          'Travel',
          'Miscellaneous Fun',
        ],
      },
    ],
  },
];

export default function OnboardingModal({ open, onOpenChange, type }) {
  const [planState, setPlanState] = useAtom(planAtom);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(0);

  // Reset to first page whenever modal opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Update preview when strategy changes
  useEffect(() => {
    const strat = strategies.find((s) => s.id === selectedStrategy);
    setPreview(strat || null);
  }, [selectedStrategy]);

  const handleConfirm = async () => {
    // If user chose to start blank, skip seeding
    if (selectedStrategy && selectedStrategy !== 'blank' && planState) {
      const strat = strategies.find((s) => s.id === selectedStrategy);
      const oldPlan = planState.clone();
      const newPlan = planState.clone();
      // Seed client state
      for (const catDef of strat.categories) {
        const categoryId = uuidv4();
        const otherId = `${categoryId}_other`;
        newPlan.addCategory({
          categoryId,
          otherSubcategoryId: otherId,
          name: catDef.name,
          monthlyGoal: 0,
          type,
          isImmutable: false,
        });
        // Create subcategories
        const addedCategory = newPlan.categories.find(
          (c) => c.categoryId === categoryId
        );
        for (const subName of catDef.subcategories) {
          const subId = uuidv4();
          addedCategory.createSubcategory({
            subcategoryId: subId,
            name: subName,
            monthlyGoal: 0,
            isImmutable: false,
          });
        }
      }
      setPlanState(newPlan);
      onOpenChange(false);

      // Persist to server
      for (const catDef of strat.categories) {
        // Find the matching category by name (just created)
        const c = newPlan.categories.find((c) => c.name === catDef.name);
        if (!c) continue;
        await createCategory({
          categoryId: c.categoryId,
          otherSubcategoryId: c.subcategories[0].subcategoryId,
          name: c.name,
          monthlyGoal: 0,
          planId: 'initial',
          type,
        });
        for (const subDef of catDef.subcategories) {
          const s = c.subcategories.find((s) => s.name === subDef);
          if (!s) continue;
          await createSubcategory({
            subcategoryId: s.subcategoryId,
            categoryId: c.categoryId,
            name: s.name,
            monthlyGoal: 0,
            planId: 'initial',
          });
        }
      }
    }

    // Persist completion to user prefs and close
    await setOnboardingStatus({ done: true });
  };

  // Intercept close as skip
  const handleDialogOpenChange = (newOpen) => {
    if (!newOpen) {
      setOnboardingStatus({ done: true });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Welcome to FinCapy!</DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Start exploring on your own or get a head start with a framework. We'll create a starting plan for you, and you can take it from there."
              : 'Get started with a budgeting framework or explore on your own.'}
          </DialogDescription>
        </DialogHeader>

        <>
          <div className="">
            <Select
              value={selectedStrategy}
              onValueChange={setSelectedStrategy}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a strategy" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectGroup>
                  <SelectItem
                    value="conscious-spending"
                    className="cursor-pointer"
                  >
                    Conscious Spending Plan (Recommended)
                  </SelectItem>
                  <SelectItem value="50-30-20" className="cursor-pointer">
                    50/30/20 Budget
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {preview && (
            <div className="text-sm text-muted-foreground">
              <p>
                Here&apos;s a preview of the top level spending categories
                you&apos;ll get:
              </p>
              {preview.categories.map((cat) => (
                <ul key={cat.name}>
                  <li>- {cat.name}</li>
                </ul>
              ))}
              {/* <p className="font-medium">
                Buckets: {preview.categories.map((cat) => cat.name).join(', ')}
              </p> */}
            </div>
          )}
        </>

        <DialogFooter>
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                await setOnboardingStatus({ done: true });
                onOpenChange(false);
              }}
            >
              Skip
            </Button>
            <Button
              disabled={!selectedStrategy}
              onClick={handleConfirm}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              Confirm
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
