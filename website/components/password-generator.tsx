"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, RefreshCw, Eye, EyeOff, History } from 'lucide-react';
import { useToolWorkspace } from '@/lib/workspace';
import {
    generatePasswordWithAnalysis,
    validateOptions,
    DEFAULT_PASSWORD_OPTIONS,
    PASSWORD_CONSTRAINTS,
    STORAGE_KEYS
} from '@/services/password';
import type {
    PasswordOptions,
    GeneratedPassword,
    PasswordWorkspaceData
} from '@/services/password';

export function PasswordGenerator() {
    const { isActive, data: workspaceData, save: saveToWorkspace } = useToolWorkspace<PasswordWorkspaceData>('password-generator');

    const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
    const [generatedPassword, setGeneratedPassword] = useState<string>('');
    const [passwordStrength, setPasswordStrength] = useState<string>('');
    const [entropy, setEntropy] = useState<number>(0);
    const [history, setHistory] = useState<GeneratedPassword[]>([]);
    const [showPassword, setShowPassword] = useState<boolean>(true);
    const [errors, setErrors] = useState<string[]>([]);
    const [copied, setCopied] = useState<boolean>(false);

    // Load data from workspace or localStorage
    useEffect(() => {
        if (isActive && workspaceData) {
            setOptions(workspaceData.options);
            setHistory(workspaceData.generatedPasswords);
        } else {
            // Load from localStorage
            const savedOptions = localStorage.getItem(STORAGE_KEYS.PASSWORD_OPTIONS);
            const savedHistory = localStorage.getItem(STORAGE_KEYS.PASSWORD_HISTORY);

            if (savedOptions) {
                try {
                    setOptions(JSON.parse(savedOptions));
                } catch (e) {
                    console.error('Error loading password options:', e);
                }
            }

            if (savedHistory) {
                try {
                    setHistory(JSON.parse(savedHistory));
                } catch (e) {
                    console.error('Error loading password history:', e);
                }
            }
        }
    }, [isActive, workspaceData]);

    // Save data to workspace or localStorage
    const saveData = useCallback(() => {
        const dataToSave: PasswordWorkspaceData = {
            generatedPasswords: history,
            options,
        };

        if (isActive) {
            saveToWorkspace(dataToSave);
        } else {
            localStorage.setItem(STORAGE_KEYS.PASSWORD_OPTIONS, JSON.stringify(options));
            localStorage.setItem(STORAGE_KEYS.PASSWORD_HISTORY, JSON.stringify(history));
        }
    }, [isActive, saveToWorkspace, options, history]);

    // Save when options or history change
    useEffect(() => {
        saveData();
    }, [saveData]);

    // Generate initial password
    useEffect(() => {
        handleGenerate();
    }, []);

    const handleGenerate = () => {
        const validationErrors = validateOptions(options);
        setErrors(validationErrors);

        if (validationErrors.length > 0) {
            return;
        }

        try {
            const result = generatePasswordWithAnalysis(options);
            setGeneratedPassword(result.password);
            setPasswordStrength(result.strength);
            setEntropy(result.entropy);

            // Add to history (keep last 20)
            setHistory(prev => {
                const newHistory = [result, ...prev];
                return newHistory.slice(0, 20);
            });
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Failed to generate password']);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const updateOption = (key: keyof PasswordOptions, value: boolean | number) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'very-strong': return 'bg-green-500';
            case 'strong': return 'bg-green-400';
            case 'medium': return 'bg-yellow-500';
            case 'weak': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatStrength = (strength: string) => {
        return strength.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Error Display */}
            {errors.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                    <CardContent className="p-4">
                        <div className="space-y-1">
                            {errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generated Password Display */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Generated Password</CardTitle>
                            <CardDescription>
                                {generatedPassword && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className={getStrengthColor(passwordStrength)}>
                                            {formatStrength(passwordStrength)}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Entropy: {entropy} bits
                                        </span>
                                    </div>
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                disabled={!generatedPassword}
                            >
                                <Copy className="h-4 w-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button onClick={handleGenerate}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Generate
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-md font-mono text-lg break-all">
                        {generatedPassword ? (
                            showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)
                        ) : (
                            <span className="text-muted-foreground">Click Generate to create a password</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Options */}
                <Card>
                    <CardHeader>
                        <CardTitle>Password Options</CardTitle>
                        <CardDescription>
                            Customize your password generation settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Length */}
                        <div className="space-y-2">
                            <Label htmlFor="length">
                                Length: {options.length}
                            </Label>
                            <Input
                                id="length"
                                type="range"
                                min={PASSWORD_CONSTRAINTS.MIN_LENGTH}
                                max={Math.min(PASSWORD_CONSTRAINTS.MAX_LENGTH, 64)}
                                value={options.length}
                                onChange={(e) => updateOption('length', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{PASSWORD_CONSTRAINTS.MIN_LENGTH}</span>
                                <span>64</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Character Types */}
                        <div className="space-y-4">
                            <Label>Include Characters</Label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="uppercase">Uppercase Letters (A-Z)</Label>
                                    <Switch
                                        id="uppercase"
                                        checked={options.includeUppercase}
                                        onCheckedChange={(checked) => updateOption('includeUppercase', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="lowercase">Lowercase Letters (a-z)</Label>
                                    <Switch
                                        id="lowercase"
                                        checked={options.includeLowercase}
                                        onCheckedChange={(checked) => updateOption('includeLowercase', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                                    <Switch
                                        id="numbers"
                                        checked={options.includeNumbers}
                                        onCheckedChange={(checked) => updateOption('includeNumbers', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="symbols">Symbols (!@#$%...)</Label>
                                    <Switch
                                        id="symbols"
                                        checked={options.includeSymbols}
                                        onCheckedChange={(checked) => updateOption('includeSymbols', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Exclusion Options */}
                        <div className="space-y-4">
                            <Label>Exclude Characters</Label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="excludeSimilar">Similar Characters</Label>
                                        <p className="text-xs text-muted-foreground">Excludes: i, l, 1, L, o, 0, O</p>
                                    </div>
                                    <Switch
                                        id="excludeSimilar"
                                        checked={options.excludeSimilar}
                                        onCheckedChange={(checked) => updateOption('excludeSimilar', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="excludeAmbiguous">Ambiguous Characters</Label>
                                        <p className="text-xs text-muted-foreground">Excludes: {`{ } [ ] ( ) / \\ ' " \` ~ , ; < > . ?`}</p>
                                    </div>
                                    <Switch
                                        id="excludeAmbiguous"
                                        checked={options.excludeAmbiguous}
                                        onCheckedChange={(checked) => updateOption('excludeAmbiguous', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Recent Passwords
                        </CardTitle>
                        <CardDescription>
                            Recently generated passwords (click to copy)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                No passwords generated yet
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {history.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 border rounded-md hover:bg-muted cursor-pointer"
                                        onClick={() => navigator.clipboard.writeText(item.password)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-sm truncate">
                                                {showPassword ? item.password : '•'.repeat(item.password.length)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${getStrengthColor(item.strength)}`}
                                                >
                                                    {formatStrength(item.strength)}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.entropy} bits
                                                </span>
                                            </div>
                                        </div>
                                        <Copy className="h-3 w-3 text-muted-foreground ml-2" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}