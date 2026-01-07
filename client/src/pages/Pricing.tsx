import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier } from '../types/api';
import { useState } from 'react';

export function Pricing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState<SubscriptionTier | null>(null);

  const { data: tiers } = useQuery({
    queryKey: ['tiers'],
    queryFn: api.getTiers,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: api.getSubscription,
    enabled: !!user,
  });

  const upgradeMutation = useMutation({
    mutationFn: (tier: SubscriptionTier) => api.upgradeSubscription({ tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['limits'] });
      setUpgrading(null);
    },
  });

  const handleUpgrade = (tier: SubscriptionTier) => {
    setUpgrading(tier);
    upgradeMutation.mutate(tier);
  };

  const currentTier = subscription?.tier || 'FREE';

  const tierOrder: SubscriptionTier[] = ['FREE', 'PRO', 'TEAM'];

  const getTierFeatures = (tier: SubscriptionTier): string[] => {
    if (!tiers) return [];

    const config = tiers[tier];
    const features: string[] = [];

    if (config.limits.maxTodos === null) {
      features.push('Unlimited todos');
    } else {
      features.push(`Up to ${config.limits.maxTodos} todos`);
    }

    if (config.limits.maxTags === null) {
      features.push('Unlimited tags');
    } else {
      features.push(`Up to ${config.limits.maxTags} tags`);
    }

    if (config.limits.maxCollaborators) {
      if (config.limits.maxCollaborators === null) {
        features.push('Unlimited collaborators');
      } else {
        features.push(`Up to ${config.limits.maxCollaborators} collaborators`);
      }
    } else {
      features.push('Solo workspace');
    }

    if (config.limits.hasRecurringTasks) features.push('Recurring tasks');
    if (config.limits.hasTimeTracking) features.push('Time tracking & timers');
    if (config.limits.hasCalendarIntegration) features.push('Calendar integration');
    if (config.limits.hasTemplates) features.push('Task templates');
    if (config.limits.hasAdvancedNotifications) features.push('Advanced notifications');
    if (config.limits.hasAnalytics) features.push('Analytics & reports');
    if (config.limits.hasApiAccess) features.push('API access & webhooks');

    return features;
  };

  if (!tiers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600">
            Upgrade to unlock premium features and boost your productivity
          </p>
          {subscription && (
            <div className="mt-6">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                Current Plan: {tiers[currentTier].name}
              </span>
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {tierOrder.map((tier) => {
            const config = tiers[tier];
            const isCurrent = currentTier === tier;
            const features = getTierFeatures(tier);
            const isUpgrading = upgrading === tier;

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border-2 ${
                  isCurrent
                    ? 'border-blue-500 shadow-xl'
                    : 'border-gray-200 shadow-sm'
                } bg-white p-8`}
              >
                {isCurrent && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-fit">
                    <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{config.name}</h3>

                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-bold tracking-tight">
                      ${config.price}
                    </span>
                    {config.billingPeriod !== 'lifetime' && (
                      <span className="ml-1 text-xl font-semibold text-gray-500">
                        /{config.billingPeriod}
                      </span>
                    )}
                  </p>

                  <ul className="mt-8 space-y-4">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-6 w-6 flex-shrink-0 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={isCurrent || isUpgrading || !user}
                  className={`mt-8 w-full rounded-lg px-4 py-3 text-center text-base font-semibold transition-colors ${
                    isCurrent
                      ? 'cursor-default bg-gray-100 text-gray-500'
                      : tier === 'PRO'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : tier === 'TEAM'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {!user
                    ? 'Sign in to upgrade'
                    : isCurrent
                    ? 'Current Plan'
                    : isUpgrading
                    ? 'Upgrading...'
                    : tier === 'FREE'
                    ? 'Downgrade to Free'
                    : `Upgrade to ${config.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
